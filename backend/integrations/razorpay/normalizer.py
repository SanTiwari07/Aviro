"""
Normalization layer for Razorpay data payloads.
Converts raw provider JSON into strictly typed internal models.
Ensures financial amounts are integer minor units (paise), timestamps are ISO 8601,
and full data provenance is tagged.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional

from .errors import RazorpayNormalizationError

logger = logging.getLogger("arivo.razorpay.normalizer")


def _epoch_to_iso(epoch_seconds: Any) -> str:
    """Converts a Unix epoch integer to an ISO 8601 UTC string."""
    try:
        val = int(epoch_seconds)
        dt = datetime.fromtimestamp(val, tz=timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class PaymentNormalizer:
    @staticmethod
    def normalize_single(raw: Dict[str, Any], sync_id: str) -> Dict[str, Any]:
        """
        Normalizes a single Razorpay payment item.
        Raises RazorpayNormalizationError if required invariants fail.
        """
        pay_id = raw.get("id")
        if not pay_id or not isinstance(pay_id, str):
            raise RazorpayNormalizationError("Payment missing valid 'id' identifier.")

        raw_amount = raw.get("amount")
        if raw_amount is None:
            raise RazorpayNormalizationError(f"Payment {pay_id} missing 'amount'.")
        try:
            amount = int(raw_amount)
            if amount < 0:
                raise ValueError("Amount cannot be negative")
        except (ValueError, TypeError) as err:
            raise RazorpayNormalizationError(f"Payment {pay_id} has invalid amount: {raw_amount} ({err})")

        currency = str(raw.get("currency", "INR")).upper()
        if currency != "INR":
            raise RazorpayNormalizationError(f"Unsupported currency: {currency}. ARIVO operates strictly in INR.")
        status = str(raw.get("status", "CAPTURED")).upper()
        created_at = _epoch_to_iso(raw.get("created_at"))

        # Determine reference identifier
        notes = raw.get("notes") or {}
        reference = notes.get("reference") or f"REF-{pay_id}"

        return {
            "payment_id": pay_id,
            "order_id": raw.get("order_id"),
            "merchant_id": raw.get("merchant_id") or "razorpay_account",
            "amount": amount,
            "currency": currency,
            "status": status,
            "created_at": created_at,
            "reference": reference,
            "source": "razorpay_test",
            "source_record_id": pay_id,
            "sync_id": sync_id,
            "fee": int(raw.get("fee") or 0),
            "tax": int(raw.get("tax") or 0),
            "method": raw.get("method"),
        }

    @classmethod
    def normalize(cls, raw: Dict[str, Any], sync_id: str = "SYNC_DEFAULT") -> Dict[str, Any]:
        """Convenience alias for normalize_single."""
        return cls.normalize_single(raw, sync_id)

    @classmethod
    def normalize_batch(
        cls, items: List[Dict[str, Any]], sync_id: str
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Normalizes a batch of payments.
        Returns (normalized_records, rejected_count).
        """
        normalized: List[Dict[str, Any]] = []
        rejected = 0

        for raw in items:
            try:
                norm = cls.normalize_single(raw, sync_id)
                normalized.append(norm)
            except RazorpayNormalizationError as ne:
                logger.warning(f"[Normalizer] Payment rejected: {ne}")
                rejected += 1
            except Exception as e:
                logger.error(f"[Normalizer] Unexpected error normalizing payment: {e}")
                rejected += 1

        return normalized, rejected


class SettlementNormalizer:
    @staticmethod
    def normalize_single(raw: Dict[str, Any], sync_id: str) -> Dict[str, Any]:
        """
        Normalizes a single Razorpay settlement item.
        Computes the settlement waterfall and flags any discrepancy.
        """
        setl_id = raw.get("id")
        if not setl_id or not isinstance(setl_id, str):
            raise RazorpayNormalizationError("Settlement missing valid 'id' identifier.")

        try:
            net_amount = int(raw.get("amount", 0))
            fees = int(raw.get("fees", 0))
            tax = int(raw.get("tax", 0))
            refunds = int(raw.get("refunds", 0))
            chargebacks = int(raw.get("chargebacks", 0))
            adjustments = int(raw.get("adjustments", 0))
        except (ValueError, TypeError) as err:
            raise RazorpayNormalizationError(f"Settlement {setl_id} has invalid financial figures: {err}")

        # In Razorpay, settlement amount is net deposited
        # Gross = Net + Fees + Tax + Refunds + Chargebacks - Adjustments
        gross_amount = raw.get("gross_amount")
        if gross_amount is not None:
            gross_amount = int(gross_amount)
        else:
            gross_amount = net_amount + fees + tax + refunds + chargebacks - adjustments

        expected_net = gross_amount - fees - tax - refunds - chargebacks + adjustments
        unexplained_delta = abs(expected_net - net_amount)

        created_at = _epoch_to_iso(raw.get("created_at"))
        status = str(raw.get("status", "PROCESSED")).upper()
        currency = str(raw.get("currency", "INR")).upper()

        payment_reference = raw.get("payment_reference") or f"REF-{raw.get('payment_id', '')}"
        utr = raw.get("utr")

        return {
            "settlement_id": setl_id,
            "merchant_id": raw.get("merchant_id") or "razorpay_account",
            "gross_amount": gross_amount,
            "fees": fees,
            "tax": tax,
            "refunds": refunds,
            "chargebacks": chargebacks,
            "adjustments": adjustments,
            "net_amount": net_amount,
            "currency": currency,
            "status": status,
            "created_at": created_at,
            "payment_reference": payment_reference,
            "source": "razorpay_test",
            "source_record_id": setl_id,
            "sync_id": sync_id,
            "utr": utr,
            "unexplained_delta": unexplained_delta,
        }

    @classmethod
    def normalize(cls, raw: Dict[str, Any], sync_id: str = "SYNC_DEFAULT") -> Dict[str, Any]:
        """Convenience alias for normalize_single."""
        return cls.normalize_single(raw, sync_id)

    @classmethod
    def normalize_batch(
        cls, items: List[Dict[str, Any]], sync_id: str
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Normalizes a batch of settlements.
        Returns (normalized_records, rejected_count).
        """
        normalized: List[Dict[str, Any]] = []
        rejected = 0

        for raw in items:
            try:
                norm = cls.normalize_single(raw, sync_id)
                normalized.append(norm)
            except RazorpayNormalizationError as ne:
                logger.warning(f"[Normalizer] Settlement rejected: {ne}")
                rejected += 1
            except Exception as e:
                logger.error(f"[Normalizer] Unexpected error normalizing settlement: {e}")
                rejected += 1

        return normalized, rejected
