"""
Sync service coordinating Razorpay data ingestion, validation, snapshotting, and provenance.
Decouples external data synchronization from internal reconciliation execution.
"""

import os
import csv
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from ... import database
from .client import RazorpayClient
from .normalizer import PaymentNormalizer, SettlementNormalizer
from .errors import RazorpayError, RazorpayAuthError

logger = logging.getLogger("arivo.razorpay.sync")


class RazorpaySyncService:
    def __init__(self, client: Optional[RazorpayClient] = None):
        self.client = client or RazorpayClient()

    def get_latest_sync(self, db: Session) -> Optional[database.SyncRecord]:
        """Returns the most recent sync attempt regardless of status."""
        return (
            db.query(database.SyncRecord)
            .filter(database.SyncRecord.source == "razorpay_test")
            .order_by(database.SyncRecord.id.desc())
            .first()
        )

    def get_last_successful_sync(self, db: Session) -> Optional[database.SyncRecord]:
        """Returns the most recent successful sync snapshot."""
        return (
            db.query(database.SyncRecord)
            .filter(
                database.SyncRecord.source == "razorpay_test",
                database.SyncRecord.status == "SUCCESS",
            )
            .order_by(database.SyncRecord.id.desc())
            .first()
        )

    def sync_local_dataset(self, db: Session, sync_id: str, started_at: str) -> Dict[str, Any]:
        """
        Loads the local Razorpay-compatible synthetic dataset into SQLite
        under source='razorpay_test'.
        Uses RZP_ prefix on payment_id and settlement_id so that records never
        collide with source='synthetic' in SQLite tables with UNIQUE constraints.
        Preserves original IDs in source_record_id.
        """
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        data_dir = os.path.join(project_root, "dataset", "data")
        payments_path = os.path.join(data_dir, "payments.csv")
        settlements_path = os.path.join(data_dir, "settlements.csv")

        if not os.path.exists(payments_path):
            raise FileNotFoundError(f"Payments dataset not found: {payments_path}")
        if not os.path.exists(settlements_path):
            raise FileNotFoundError(f"Settlements dataset not found: {settlements_path}")

        with open(payments_path, "r", encoding="utf-8") as f:
            raw_payments = list(csv.DictReader(f))
        with open(settlements_path, "r", encoding="utf-8") as f:
            raw_settlements = list(csv.DictReader(f))

        if not raw_payments or not raw_settlements:
            raise ValueError("Dataset is empty. Run: make generate-data")

        # Prepare normalized records for Razorpay Test Store
        p_dicts = []
        for row in raw_payments:
            orig_id = row["payment_id"]
            p_id = f"RZP_{orig_id}"
            p_dicts.append({
                "payment_id": p_id,
                "order_id": row.get("order_id"),
                "merchant_id": row.get("merchant_id") or "MERCH_RZP_TEST",
                "amount": int(row["amount"]),
                "currency": str(row.get("currency", "INR")).upper(),
                "status": str(row.get("status", "CAPTURED")).upper(),
                "created_at": str(row.get("created_at") or ""),
                "reference": f"REF-{p_id}",
                "source": "razorpay_test",
                "source_record_id": orig_id,
                "sync_id": sync_id,
                "fee": int(row.get("fee") or 0),
                "tax": int(row.get("tax") or 0),
                "method": row.get("method") or "card",
            })

        s_dicts = []
        for row in raw_settlements:
            orig_s_id = row["settlement_id"]
            s_id = f"RZP_{orig_s_id}"
            raw_ref = str(row.get("payment_reference") or "")
            if "REF-PAY_" in raw_ref:
                pay_ref = raw_ref.replace("REF-PAY_", "REF-RZP_PAY_")
            elif raw_ref.startswith("REF-"):
                pay_ref = raw_ref.replace("REF-", "REF-RZP_")
            else:
                pay_ref = f"REF-RZP_{raw_ref}"

            gross = int(row["gross_amount"])
            fees = int(row.get("fees") or 0)
            tax = int(row.get("tax") or 0)
            refunds = int(row.get("refunds") or 0)
            chargebacks = int(row.get("chargebacks") or 0)
            adjustments = int(row.get("adjustments") or 0)
            net = int(row.get("net_amount") or (gross - fees - tax - refunds - chargebacks + adjustments))
            unexplained = int(row.get("unexplained_delta") or 0)

            s_dicts.append({
                "settlement_id": s_id,
                "merchant_id": row.get("merchant_id") or "MERCH_RZP_TEST",
                "gross_amount": gross,
                "fees": fees,
                "tax": tax,
                "refunds": refunds,
                "chargebacks": chargebacks,
                "adjustments": adjustments,
                "net_amount": net,
                "currency": str(row.get("currency", "INR")).upper(),
                "status": str(row.get("status") or "processed").upper(),
                "utr": row.get("utr") or f"UTR_{s_id}",
                "created_at": str(row.get("created_at") or ""),
                "payment_reference": pay_ref,
                "source": "razorpay_test",
                "source_record_id": orig_s_id,
                "sync_id": sync_id,
                "unexplained_delta": unexplained,
            })

        # Efficient idempotent persistence
        existing_p_ids = set(r[0] for r in db.query(database.Payment.payment_id).filter(database.Payment.source == "razorpay_test").all())
        existing_s_ids = set(r[0] for r in db.query(database.Settlement.settlement_id).filter(database.Settlement.source == "razorpay_test").all())

        new_p = [database.Payment(**p) for p in p_dicts if p["payment_id"] not in existing_p_ids]
        new_s = [database.Settlement(**s) for s in s_dicts if s["settlement_id"] not in existing_s_ids]

        if new_p:
            db.bulk_save_objects(new_p)
        if new_s:
            db.bulk_save_objects(new_s)

        # Update existing records if already present
        if existing_p_ids:
            for p in p_dicts:
                if p["payment_id"] in existing_p_ids:
                    db.query(database.Payment).filter_by(payment_id=p["payment_id"]).update(p)
        if existing_s_ids:
            for s in s_dicts:
                if s["settlement_id"] in existing_s_ids:
                    db.query(database.Settlement).filter_by(settlement_id=s["settlement_id"]).update(s)

        completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Record successful sync metadata
        sync_rec = database.SyncRecord(
            sync_id=sync_id,
            source="razorpay_test",
            started_at=started_at,
            completed_at=completed_at,
            status="SUCCESS",
            payments_fetched=len(p_dicts),
            settlements_fetched=len(s_dicts),
            records_normalized=len(p_dicts) + len(s_dicts),
            records_rejected=0,
            pages_fetched=1,
        )
        db.add(sync_rec)
        db.commit()

        logger.info(
            f"[Sync] Completed local synthetic sync {sync_id}: {len(p_dicts)} payments, {len(s_dicts)} settlements"
        )

        return {
            "sync_id": sync_id,
            "status": "SUCCESS",
            "source": "razorpay_test",
            "mode": "synthetic",
            "dataset": "dataset/data/payments.csv + settlements.csv",
            "payments_fetched": len(p_dicts),
            "settlements_fetched": len(s_dicts),
            "records_normalized": len(p_dicts) + len(s_dicts),
            "records_rejected": 0,
            "pages_fetched": 1,
            "completed_at": completed_at,
            "message": f"Synced {len(p_dicts):,} payments and {len(s_dicts):,} settlements from Razorpay-compatible test dataset.",
        }

    def sync(self, db: Session, mode: str = "auto", max_pages: int = 10) -> Dict[str, Any]:
        """
        Executes a Razorpay Test Store synchronization.
        Supports:
          - mode="synthetic": explicitly loads local Razorpay-compatible test dataset.
          - mode="live": strictly contacts Razorpay live REST API.
          - mode="auto": attempts live API if configured; if live API returns 0 items
            or credentials are missing, falls back to the local Razorpay-compatible test dataset.
        Never silently returns 0 records when the test dataset is available.
        """
        now_utc = datetime.now(timezone.utc)
        sync_id = f"SYNC_{now_utc.strftime('%Y%m%d_%H%M%S')}"
        started_at = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

        if mode == "synthetic":
            return self.sync_local_dataset(db, sync_id, started_at)

        if not self.client.is_configured:
            if mode == "live":
                err_msg = "Razorpay API credentials not configured in environment. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env."
                sync_rec = database.SyncRecord(
                    sync_id=sync_id,
                    source="razorpay_test",
                    started_at=started_at,
                    completed_at=started_at,
                    status="FAILED",
                    error_code="CREDENTIALS_MISSING",
                    error_message=err_msg,
                )
                db.add(sync_rec)
                db.commit()
                return {
                    "sync_id": sync_id,
                    "status": "FAILED",
                    "error": err_msg,
                    "last_successful_snapshot": self.get_last_successful_sync(db),
                }
            else:
                logger.info("[Sync] Razorpay API not configured; loading local Razorpay-compatible dataset.")
                return self.sync_local_dataset(db, sync_id, started_at)

        # Stage sync record as PENDING
        sync_rec = database.SyncRecord(
            sync_id=sync_id,
            source="razorpay_test",
            started_at=started_at,
            status="PENDING",
        )
        db.add(sync_rec)
        db.commit()

        try:
            # 1. Fetch Payments & Settlements via paginated client
            raw_payments, pay_pages = self.client.fetch_payments(max_pages=max_pages)
            raw_settlements, setl_pages = self.client.fetch_settlements(max_pages=max_pages)
            total_pages = pay_pages + setl_pages

            # If live account returned zero records and mode is 'auto', populate from local test dataset
            if not raw_payments and not raw_settlements and mode == "auto":
                logger.info("[Sync] Live Razorpay API returned 0 items; loading local Razorpay-compatible test dataset for Razorpay Test Store.")
                try:
                    db.delete(sync_rec)
                    db.commit()
                except Exception:
                    db.rollback()
                return self.sync_local_dataset(db, sync_id, started_at)

            # 2. Normalize and validate records
            norm_payments, rej_payments = PaymentNormalizer.normalize_batch(raw_payments, sync_id)
            norm_settlements, rej_settlements = SettlementNormalizer.normalize_batch(raw_settlements, sync_id)
            total_normalized = len(norm_payments) + len(norm_settlements)
            total_rejected = rej_payments + rej_settlements

            # 3. Idempotently persist snapshot to database
            for p_dict in norm_payments:
                existing_p = (
                    db.query(database.Payment)
                    .filter_by(payment_id=p_dict["payment_id"])
                    .first()
                )
                if existing_p:
                    for k, v in p_dict.items():
                        setattr(existing_p, k, v)
                else:
                    db.add(database.Payment(**p_dict))

            for s_dict in norm_settlements:
                existing_s = (
                    db.query(database.Settlement)
                    .filter_by(settlement_id=s_dict["settlement_id"])
                    .first()
                )
                if existing_s:
                    for k, v in s_dict.items():
                        setattr(existing_s, k, v)
                else:
                    db.add(database.Settlement(**s_dict))

            # 4. Finalize sync record
            completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            sync_rec.status = "SUCCESS"
            sync_rec.completed_at = completed_at
            sync_rec.payments_fetched = len(raw_payments)
            sync_rec.settlements_fetched = len(raw_settlements)
            sync_rec.records_normalized = total_normalized
            sync_rec.records_rejected = total_rejected
            sync_rec.pages_fetched = total_pages
            db.commit()

            logger.info(
                f"[Sync] Completed live API sync {sync_id}: {len(norm_payments)} payments, {len(norm_settlements)} settlements"
            )

            return {
                "sync_id": sync_id,
                "status": "SUCCESS",
                "source": "razorpay_test",
                "mode": "live",
                "payments_fetched": len(raw_payments),
                "settlements_fetched": len(raw_settlements),
                "records_normalized": total_normalized,
                "records_rejected": total_rejected,
                "pages_fetched": total_pages,
                "completed_at": completed_at,
                "message": f"Synced {len(raw_payments):,} payments and {len(raw_settlements):,} settlements from live Razorpay API.",
            }

        except RazorpayError as rpe:
            db.rollback()
            if mode == "auto":
                logger.warning(f"[Sync] Razorpay API error ({rpe.message}); falling back to local test dataset.")
                try:
                    db.delete(sync_rec)
                    db.commit()
                except Exception:
                    db.rollback()
                return self.sync_local_dataset(db, sync_id, started_at)

            completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            sync_rec = db.query(database.SyncRecord).filter_by(sync_id=sync_id).first()
            if sync_rec:
                sync_rec.status = "FAILED"
                sync_rec.completed_at = completed_at
                sync_rec.error_code = rpe.__class__.__name__
                sync_rec.error_message = rpe.message
                db.commit()

            logger.error(f"[Sync] Razorpay error during {sync_id}: {rpe.message}")
            return {
                "sync_id": sync_id,
                "status": "FAILED",
                "error": rpe.message,
                "error_code": rpe.__class__.__name__,
                "last_successful_snapshot": self.get_last_successful_sync(db),
            }

        except Exception as ex:
            db.rollback()
            completed_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            sync_rec = db.query(database.SyncRecord).filter_by(sync_id=sync_id).first()
            if sync_rec:
                sync_rec.status = "FAILED"
                sync_rec.completed_at = completed_at
                sync_rec.error_code = "UNEXPECTED_ERROR"
                sync_rec.error_message = str(ex)
                db.commit()

            logger.error(f"[Sync] Unexpected error during {sync_id}: {ex}")
            return {
                "sync_id": sync_id,
                "status": "FAILED",
                "error": str(ex),
                "error_code": "UNEXPECTED_ERROR",
                "last_successful_snapshot": self.get_last_successful_sync(db),
            }
