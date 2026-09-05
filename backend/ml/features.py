"""
Centralized Feature Extraction for ARIVO ML Candidate Ranking Layer.
Shared single-source-of-truth across training, evaluation, and production inference.
Enforces zero label leakage: candidate_count is uniform across all candidates of a payment.
"""

import difflib
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

# Canonical ordered list of features used by the XGBoost Candidate Ranking model
FEATURE_NAMES: List[str] = [
    "amount_delta",
    "amount_ratio",
    "amount_exact_match",
    "date_delta_days",
    "date_within_window",
    "merchant_match",
    "currency_match",
    "reference_similarity",
    "reference_exact_match",
    "candidate_count",
]


def _safe_int(val: Any, default: int = 0) -> int:
    if val is None:
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def _safe_str(val: Any) -> str:
    if val is None:
        return ""
    return str(val).strip()


def _parse_datetime(val: Any) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    s = str(val).strip()
    if not s:
        return None
    # Normalize ISO 8601 strings
    s = s.replace("Z", "+00:00")
    for fmt in (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    try:
        # Fallback to dateutil if available
        from dateutil import parser
        return parser.parse(s)
    except Exception:
        return None


def extract_candidate_features(
    payment: Union[Dict[str, Any], Any],
    settlement: Union[Dict[str, Any], Any],
    candidate_count: int = 1,
) -> Dict[str, float]:
    """
    Extracts deterministic ranking features for a (payment, settlement) candidate pair.

    CRITICAL INVARIANT:
    candidate_count is the total number of candidate settlements considered for this
    payment. It MUST be computed once per payment and provided identically to all
    candidate pairs for that payment to eliminate candidate-count label leakage.
    """
    # Helper to access dict or object attributes
    def get_val(obj: Any, key: str, default: Any = None) -> Any:
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    # 1. Amount features (integer paise)
    p_amt = _safe_int(get_val(payment, "amount", 0))
    s_amt = _safe_int(get_val(settlement, "gross_amount", get_val(settlement, "amount", 0)))

    amount_delta = float(abs(p_amt - s_amt))

    if p_amt > 0 and s_amt > 0:
        amount_ratio = float(min(p_amt, s_amt) / max(p_amt, s_amt))
    elif p_amt == 0 and s_amt == 0:
        amount_ratio = 1.0
    else:
        amount_ratio = 0.0

    amount_exact_match = 1.0 if (p_amt == s_amt and p_amt > 0) else 0.0

    # 2. Date features (days elapsed)
    p_date = _parse_datetime(get_val(payment, "created_at") or get_val(payment, "payment_date") or get_val(payment, "date"))
    s_date = _parse_datetime(get_val(settlement, "created_at") or get_val(settlement, "settlement_date") or get_val(settlement, "date"))

    if p_date and s_date:
        # Strip timezone awareness differences if any
        dt1 = p_date.replace(tzinfo=None)
        dt2 = s_date.replace(tzinfo=None)
        date_delta_days = float(abs((dt2 - dt1).total_seconds()) / 86400.0)
    else:
        date_delta_days = 2.0  # Default assumed T+2 settlement lag

    # Indian banking clearing standard is T+0 to T+3
    date_within_window = 1.0 if (0.0 <= date_delta_days <= 3.5) else 0.0

    # 3. Merchant match
    p_merch = _safe_str(get_val(payment, "merchant_id")).upper()
    s_merch = _safe_str(get_val(settlement, "merchant_id")).upper()
    if p_merch and s_merch:
        merchant_match = 1.0 if (p_merch == s_merch) else 0.0
    elif not p_merch and not s_merch:
        merchant_match = 1.0
    else:
        merchant_match = 0.0

    # 4. Currency match
    p_curr = _safe_str(get_val(payment, "currency", "INR")).upper()
    s_curr = _safe_str(get_val(settlement, "currency", "INR")).upper()
    currency_match = 1.0 if (p_curr == s_curr) else 0.0

    # 5. Reference string similarity
    p_id = _safe_str(get_val(payment, "payment_id", ""))
    p_ref = _safe_str(get_val(payment, "reference", f"REF-{p_id}")).upper()
    s_ref = _safe_str(get_val(settlement, "payment_reference", get_val(settlement, "reference", ""))).upper()

    if p_ref and s_ref:
        reference_similarity = float(difflib.SequenceMatcher(None, p_ref, s_ref).ratio())
    else:
        reference_similarity = 0.0

    reference_exact_match = 1.0 if (reference_similarity >= 0.999) else 0.0

    # 6. Candidate pool size (uniformly assigned)
    cand_count = float(max(1, candidate_count))

    return {
        "amount_delta": amount_delta,
        "amount_ratio": amount_ratio,
        "amount_exact_match": amount_exact_match,
        "date_delta_days": date_delta_days,
        "date_within_window": date_within_window,
        "merchant_match": merchant_match,
        "currency_match": currency_match,
        "reference_similarity": reference_similarity,
        "reference_exact_match": reference_exact_match,
        "candidate_count": cand_count,
    }


def candidate_features_to_vector(features: Dict[str, float]) -> List[float]:
    """Converts a feature dict into a vector matching canonical FEATURE_NAMES order."""
    return [float(features.get(name, 0.0)) for name in FEATURE_NAMES]
