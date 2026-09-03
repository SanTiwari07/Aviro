"""
Deterministic reconciliation engine with waterfall verification,
duplicate allocation checks, and source provenance tracking.
"""

import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

# 5,000,000 paise = 50,000 INR
HIGH_VALUE_THRESHOLD_PAISE = 5000000


def run_reconciliation(
    payments: List[Dict[str, Any]],
    settlements: List[Dict[str, Any]],
    run_id: Optional[str] = None,
    source: str = "synthetic",
    sync_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Deterministic reconciliation engine.
    Matches payments to settlements.
    Enforces settlement waterfall math, duplicate allocation protection,
    and constructs full candidate evidence for the Control Gate and Gemini.
    """
    cases = []
    active_run_id = run_id or f"RUN_{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Fast lookup indexes
    settlements_by_ref: Dict[str, Dict[str, Any]] = {}
    settlements_by_id: Dict[str, Dict[str, Any]] = {}

    for s in settlements:
        setl_id = s.get("settlement_id")
        if setl_id:
            settlements_by_id[setl_id] = s
        ref = s.get("payment_reference")
        if ref:
            settlements_by_ref[ref] = s

    # Track allocated settlements to prevent duplicate money movement
    allocated_settlement_ids: set = set()

    for p in payments:
        pay_id = p.get("payment_id")
        amount = int(p.get("amount", 0))
        p_currency = str(p.get("currency", "INR")).upper()
        p_source = p.get("source") or source
        p_sync_id = p.get("sync_id") or sync_id
        is_high_val = amount >= HIGH_VALUE_THRESHOLD_PAISE

        case = {
            "case_id": f"CASE_{uuid.uuid4().hex[:8].upper()}",
            "run_id": active_run_id,
            "payment_id": pay_id,
            "settlement_id": None,
            "amount": amount,
            "status": "REVIEW",
            "match_method": None,
            "financial_impact": amount,
            "amount_delta": 0,
            "source": p_source,
            "source_record_id": p.get("source_record_id") or pay_id,
            "sync_id": p_sync_id,
            "created_at": timestamp,
            "ai_reason": "AI Not required. Reason: Unique identifier and financial controls were sufficient.",
            "candidate": {},
        }

        # 1. Check exact unique identifier match
        expected_ref = f"REF-{pay_id}"
        s_match = settlements_by_ref.get(expected_ref)
        if not s_match:
            # Check if payment reference explicitly references a settlement ID
            p_ref = p.get("reference")
            if p_ref and p_ref in settlements_by_id:
                s_match = settlements_by_id[p_ref]

        if s_match:
            matched_setl_id = s_match["settlement_id"]
            case["settlement_id"] = matched_setl_id
            gross = int(s_match.get("gross_amount", 0))
            s_currency = str(s_match.get("currency", "INR")).upper()
            delta = abs(amount - gross)
            case["amount_delta"] = delta

            # Duplicate allocation check
            is_duplicate = matched_setl_id in allocated_settlement_ids
            if not is_duplicate:
                allocated_settlement_ids.add(matched_setl_id)

            # Settlement waterfall check
            unexplained_delta = int(s_match.get("unexplained_delta", 0)) > 0
            curr_mismatch = p_currency != s_currency

            if delta == 0 and not is_duplicate and not unexplained_delta and not curr_mismatch:
                case["candidate"] = {
                    "match_method": "EXACT_ID",
                    "amount_delta": 0,
                    "multiple_candidates": False,
                    "high_value": is_high_val,
                    "conflicting_evidence": False,
                    "duplicate_allocation": False,
                    "unexplained_delta": False,
                    "currency_mismatch": False,
                }
            else:
                method = "AMOUNT_MISMATCH" if delta != 0 else (
                    "DUPLICATE_ALLOCATION" if is_duplicate else "WATERFALL_ANOMALY"
                )
                case["candidate"] = {
                    "match_method": method,
                    "amount_delta": delta,
                    "multiple_candidates": False,
                    "high_value": is_high_val,
                    "conflicting_evidence": True,
                    "duplicate_allocation": is_duplicate,
                    "unexplained_delta": unexplained_delta,
                    "currency_mismatch": curr_mismatch,
                }
                case["ai_reason"] = (
                    "AI Investigated. Reason: Non-zero delta or conflicting settlement evidence required investigation."
                )

        else:
            # Look for candidate settlements matching amount
            amount_candidates = [
                s for s in settlements
                if int(s.get("gross_amount", 0)) == amount and s.get("settlement_id") not in allocated_settlement_ids
            ]

            if len(amount_candidates) == 1:
                cand = amount_candidates[0]
                cand_id = cand["settlement_id"]
                case["settlement_id"] = cand_id
                allocated_settlement_ids.add(cand_id)
                case["candidate"] = {
                    "match_method": "AMOUNT_DATE",
                    "amount_delta": 0,
                    "multiple_candidates": False,
                    "high_value": is_high_val,
                    "conflicting_evidence": True,  # Missing exact reference ID
                    "duplicate_allocation": False,
                    "unexplained_delta": int(cand.get("unexplained_delta", 0)) > 0,
                    "currency_mismatch": p_currency != str(cand.get("currency", "INR")).upper(),
                }
                case["ai_reason"] = (
                    "AI Investigated. Reason: Missing exact identifier; amount heuristic required semantic verification."
                )
            elif len(amount_candidates) > 1:
                case["candidate"] = {
                    "match_method": "MULTIPLE",
                    "amount_delta": 0,
                    "multiple_candidates": True,
                    "high_value": is_high_val,
                    "conflicting_evidence": True,
                    "duplicate_allocation": False,
                    "unexplained_delta": False,
                    "currency_mismatch": False,
                }
                case["ai_reason"] = (
                    "AI Investigated. Reason: Multiple candidate settlements matched transaction amount."
                )
            else:
                case["candidate"] = {
                    "match_method": "NO_MATCH",
                    "amount_delta": amount,
                    "multiple_candidates": False,
                    "high_value": is_high_val,
                    "conflicting_evidence": False,
                    "duplicate_allocation": False,
                    "unexplained_delta": False,
                    "currency_mismatch": False,
                }
                case["ai_reason"] = "AI Not required. Reason: No candidate settlement found in current snapshot."

        cases.append(case)

    return cases
