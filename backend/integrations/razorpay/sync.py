"""
Sync service coordinating Razorpay data ingestion, validation, snapshotting, and provenance.
Decouples external data synchronization from internal reconciliation execution.
"""

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

    def sync(self, db: Session, max_pages: int = 10) -> Dict[str, Any]:
        """
        Executes a complete Razorpay Test API sync.
        Lifecycle: SYNC -> VALIDATION -> SNAPSHOT -> PERSISTENCE.
        Never silently overwrites or empties financial tables on API failure.
        """
        now_utc = datetime.now(timezone.utc)
        sync_id = f"SYNC_{now_utc.strftime('%Y%m%d_%H%M%S')}"
        started_at = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

        if not self.client.is_configured:
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
                f"[Sync] Completed {sync_id}: {len(norm_payments)} payments, {len(norm_settlements)} settlements"
            )

            return {
                "sync_id": sync_id,
                "status": "SUCCESS",
                "payments_fetched": len(raw_payments),
                "settlements_fetched": len(raw_settlements),
                "records_normalized": total_normalized,
                "records_rejected": total_rejected,
                "pages_fetched": total_pages,
                "completed_at": completed_at,
            }

        except RazorpayError as rpe:
            db.rollback()
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
