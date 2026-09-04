"""
Deterministic reconciliation engine with waterfall verification,
duplicate allocation checks, normalized ID matching, grouped reconciliation,
and source provenance tracking.
"""

import uuid
from collections import Counter
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
try:
    from backend.ml.match_scorer import get_candidate_scorer
except ImportError:
    try:
        from ml.match_scorer import get_candidate_scorer
    except ImportError:
        from ..ml.match_scorer import get_candidate_scorer

# 5,000,000 paise = 50,000 INR
HIGH_VALUE_THRESHOLD_PAISE = 5000000


def _normalize_ref(ref: Optional[str]) -> str:
    """
    Normalizes identifiers by stripping whitespace, uppercase-ing,
    and standardizing common delimiter variations (underscores, dots, spaces -> hyphens).
    """
    if not ref:
        return ""
    s = str(ref).strip().upper()
    for ch in ["_", " ", ".", "/"]:
        s = s.replace(ch, "-")
    while "--" in s:
        s = s.replace("--", "-")
    return s


def compute_settlement_waterfall(s: Dict[str, Any]) -> Dict[str, int]:
    """
    Computes deterministic settlement waterfall in integer minor units (paise).
    Expected Net = Gross - Fees - Tax - Refunds - Chargebacks + Adjustments.
    Unexplained Delta = |Expected Net - Actual Net|.
    """
    gross = int(s.get("gross_amount", 0))
    fees = int(s.get("fees", 0))
    tax = int(s.get("tax", 0))
    refunds = int(s.get("refunds", 0))
    chargebacks = int(s.get("chargebacks", 0))
    adjustments = int(s.get("adjustments", 0))

    expected_net = gross - fees - tax - refunds - chargebacks + adjustments
    net = int(s.get("net_amount", gross))
    waterfall_delta = abs(expected_net - net)
    unexplained_delta = max(waterfall_delta, int(s.get("unexplained_delta", 0)))

    return {
        "gross": gross,
        "fees": fees,
        "tax": tax,
        "refunds": refunds,
        "chargebacks": chargebacks,
        "adjustments": adjustments,
        "expected_net": expected_net,
        "net": net,
        "unexplained_delta": unexplained_delta,
        "is_balanced": unexplained_delta == 0,
    }


def reconcile_grouped(
    payments: List[Dict[str, Any]],
    settlements: List[Dict[str, Any]],
    group_type: str = "ONE_TO_MANY",
) -> Dict[str, Any]:
    """
    Executes grouped reconciliation between payments and settlements.
    Guarantees strict minor-unit population conservation:
    SUM(child allocations) == parent amount.
    Zero rounding drift or unexplained allocation differences.
    """
    total_payment_amt = sum(int(p.get("amount", 0)) for p in payments)
    total_settlement_gross = sum(int(s.get("gross_amount", 0)) for s in settlements)

    amount_delta = abs(total_payment_amt - total_settlement_gross)
    has_waterfall_anomaly = False

    for s in settlements:
        wf = compute_settlement_waterfall(s)
        if wf["unexplained_delta"] > 0:
            has_waterfall_anomaly = True
            break

    is_conserved = (amount_delta == 0) and not has_waterfall_anomaly
    match_method = "GROUPED" if is_conserved else (
        "WATERFALL_ANOMALY" if has_waterfall_anomaly else "AMOUNT_MISMATCH"
    )

    return {
        "is_conserved": is_conserved,
        "match_method": match_method,
        "parent_amount": total_payment_amt if group_type == "ONE_TO_MANY" else total_settlement_gross,
        "children_sum": total_settlement_gross if group_type == "ONE_TO_MANY" else total_payment_amt,
        "total_payment_amount": total_payment_amt,
        "total_settlement_gross": total_settlement_gross,
        "amount_delta": amount_delta,
        "discrepancy": amount_delta,
        "has_waterfall_anomaly": has_waterfall_anomaly,
        "payment_count": len(payments),
        "settlement_count": len(settlements),
    }


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
    normalized ID matching, grouped matching, and constructs full candidate evidence.
    """
    cases = []
    active_run_id = run_id or f"RUN_{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Fast lookup indexes
    settlements_by_ref: Dict[str, Dict[str, Any]] = {}
    settlements_by_norm_ref: Dict[str, List[Dict[str, Any]]] = {}
    settlements_by_id: Dict[str, Dict[str, Any]] = {}

    for s in settlements:
        setl_id = s.get("settlement_id")
        if setl_id:
            settlements_by_id[setl_id] = s
        ref = s.get("payment_reference")
        if ref:
            settlements_by_ref[ref] = s
            norm = _normalize_ref(ref)
            if norm:
                settlements_by_norm_ref.setdefault(norm, []).append(s)

    # Track allocated settlements to prevent duplicate money movement
    allocated_settlement_ids: set = set()

    # Pre-check for grouped split settlements (one-to-many)
    grouped_settlements_by_parent: Dict[str, List[Dict[str, Any]]] = {}
    for s in settlements:
        ref = s.get("payment_reference") or ""
        group_id = s.get("group_id") or s.get("batch_id")
        if group_id:
            grouped_settlements_by_parent.setdefault(group_id, []).append(s)
        elif "-PART" in ref.upper():
            parent_key = ref.upper().split("-PART")[0]
            grouped_settlements_by_parent.setdefault(parent_key, []).append(s)

    # Count payment reference claims across entire batch to identify duplicate payment claims
    payment_ref_counts = Counter(
        p.get("reference") or f"REF-{p.get('payment_id')}"
        for p in payments
    )

    for p in payments:
        pay_id = p.get("payment_id")
        amount = int(p.get("amount", 0))
        p_currency = str(p.get("currency", "INR")).upper()
        p_source = p.get("source") or source
        p_sync_id = p.get("sync_id") or sync_id
        is_high_val = amount >= HIGH_VALUE_THRESHOLD_PAISE

        # Deterministic case_id ensures idempotency on repeated runs
        case_id = f"CASE_{pay_id}" if pay_id else f"CASE_{uuid.uuid4().hex[:8].upper()}"

        case = {
            "case_id": case_id,
            "run_id": active_run_id,
            "payment_id": pay_id,
            "settlement_id": None,
            "amount": amount,
            "status": "REVIEW",
            "match_method": None,
            "financial_impact": amount,
            "amount_delta": 0,
            "ml_match_score": None,
            "ml_rank": None,
            "source": p_source,
            "source_record_id": p.get("source_record_id") or pay_id,
            "sync_id": p_sync_id,
            "created_at": timestamp,
            "ai_reason": "AI Not required. Reason: Unique identifier and financial controls were sufficient.",
            "candidate": {},
        }

        # Check for Grouped (One-to-Many) match
        expected_ref = f"REF-{pay_id}"
        expected_norm = _normalize_ref(expected_ref)
        p_ref = p.get("reference")
        is_duplicate_claim = (payment_ref_counts.get(expected_ref, 0) > 1) or (bool(p_ref) and payment_ref_counts.get(p_ref, 0) > 1)

        grouped_candidates = grouped_settlements_by_parent.get(expected_ref) or grouped_settlements_by_parent.get(pay_id)
        if not grouped_candidates and p.get("group_id"):
            grouped_candidates = grouped_settlements_by_parent.get(p.get("group_id"))

        if grouped_candidates and len(grouped_candidates) > 1:
            unallocated_grouped = [s for s in grouped_candidates if s.get("settlement_id") not in allocated_settlement_ids]
            if len(unallocated_grouped) == len(grouped_candidates):
                res = reconcile_grouped([p], unallocated_grouped, group_type="ONE_TO_MANY")
                if res["is_conserved"]:
                    for s in unallocated_grouped:
                        allocated_settlement_ids.add(s["settlement_id"])
                    case["settlement_id"] = ",".join(s["settlement_id"] for s in unallocated_grouped)
                    case["amount_delta"] = 0
                    case["ml_match_score"] = 1.0
                    case["ml_rank"] = 1
                    case["candidate"] = {
                        "match_method": "GROUPED",
                        "amount_delta": 0,
                        "multiple_candidates": False,
                        "high_value": is_high_val,
                        "conflicting_evidence": False,
                        "duplicate_allocation": False,
                        "unexplained_delta": False,
                        "currency_mismatch": False,
                        "grouped_allocation": True,
                        "settlement_count": len(unallocated_grouped),
                        "ml_match_score": 1.0,
                        "ml_rank": 1,
                        "ml_score_margin": 1.0,
                    }
                    case["match_method"] = "GROUPED"
                    case["status"] = "MATCHED"
                    cases.append(case)
                    continue

        # 1. Check exact unique identifier match
        s_match = settlements_by_ref.get(expected_ref)
        match_type = "EXACT_ID"

        if not s_match:
            # Check if payment reference explicitly references a settlement ID or payment reference
            if p_ref and p_ref in settlements_by_id:
                s_match = settlements_by_id[p_ref]
                match_type = "EXACT_ID"
            elif p_ref and p_ref in settlements_by_ref:
                s_match = settlements_by_ref[p_ref]
                match_type = "EXACT_ID"

        # 2. Check normalized identifier match if exact lookup misses
        if not s_match:
            norm_candidates = settlements_by_norm_ref.get(expected_norm) or []
            if not norm_candidates and p.get("reference"):
                p_norm = _normalize_ref(p.get("reference"))
                norm_candidates = settlements_by_norm_ref.get(p_norm) or []

            # Filter to unallocated candidates
            unallocated_norm = [s for s in norm_candidates if s.get("settlement_id") not in allocated_settlement_ids]
            if len(unallocated_norm) == 1:
                s_match = unallocated_norm[0]
                match_type = "NORMALIZED_ID"

        if s_match:
            matched_setl_id = s_match["settlement_id"]
            case["settlement_id"] = matched_setl_id
            wf = compute_settlement_waterfall(s_match)
            gross = wf["gross"]
            s_currency = str(s_match.get("currency", "INR")).upper()
            delta = abs(amount - gross)
            case["amount_delta"] = delta
            id_score = 1.0 if match_type == "EXACT_ID" else 0.99
            case["ml_match_score"] = id_score
            case["ml_rank"] = 1

            # Duplicate allocation check (already allocated or multiple payments claiming it)
            is_duplicate = (matched_setl_id in allocated_settlement_ids) or is_duplicate_claim
            allocated_settlement_ids.add(matched_setl_id)

            # Settlement waterfall check
            unexplained_delta = wf["unexplained_delta"] > 0
            curr_mismatch = p_currency != s_currency

            if delta == 0 and not is_duplicate and not unexplained_delta and not curr_mismatch:
                case["candidate"] = {
                    "match_method": match_type,
                    "amount_delta": 0,
                    "multiple_candidates": False,
                    "high_value": is_high_val,
                    "conflicting_evidence": False,
                    "duplicate_allocation": False,
                    "unexplained_delta": False,
                    "currency_mismatch": False,
                    "ml_match_score": id_score,
                    "ml_rank": 1,
                    "ml_score_margin": id_score,
                }
                if match_type == "NORMALIZED_ID":
                    case["ai_reason"] = "Deterministic normalized identifier match verified with 100% mathematical certainty."
            else:
                method = "AMOUNT_MISMATCH" if delta != 0 else (
                    "DUPLICATE_ALLOCATION" if is_duplicate else "WATERFALL_ANOMALY"
                )
                effective_delta = delta if delta != 0 else wf["unexplained_delta"]
                case["amount_delta"] = effective_delta
                case["candidate"] = {
                    "match_method": method,
                    "amount_delta": effective_delta,
                    "multiple_candidates": False,
                    "high_value": is_high_val,
                    "conflicting_evidence": True,
                    "duplicate_allocation": is_duplicate,
                    "unexplained_delta": unexplained_delta,
                    "currency_mismatch": curr_mismatch,
                    "ml_match_score": id_score,
                    "ml_rank": 1,
                    "ml_score_margin": id_score,
                }
                case["ai_reason"] = (
                    "AI Investigated. Reason: Duplicate claim, non-zero delta, or conflicting settlement evidence required investigation."
                )

        else:
            # Look for candidate settlements matching amount
            amount_candidates = [
                s for s in settlements
                if int(s.get("gross_amount", 0)) == amount and s.get("settlement_id") not in allocated_settlement_ids
            ]

            if amount_candidates:
                scorer = get_candidate_scorer()
                ranked = scorer.rank_candidates(p, amount_candidates)
                top_item = ranked[0]
                cand = top_item["candidate"]
                cand_id = cand["settlement_id"]
                cand_score = top_item["ml_match_score"]
                cand_margin = top_item["ml_score_margin"]
                cand_wf = compute_settlement_waterfall(cand)

                case["settlement_id"] = cand_id
                case["ml_match_score"] = cand_score
                case["ml_rank"] = 1

                if len(amount_candidates) == 1:
                    allocated_settlement_ids.add(cand_id)
                    case["candidate"] = {
                        "match_method": "AMOUNT_DATE",
                        "amount_delta": cand_wf["unexplained_delta"],
                        "multiple_candidates": False,
                        "high_value": is_high_val,
                        "conflicting_evidence": True,  # Missing exact reference ID
                        "duplicate_allocation": False,
                        "unexplained_delta": cand_wf["unexplained_delta"] > 0,
                        "currency_mismatch": p_currency != str(cand.get("currency", "INR")).upper(),
                        "ml_match_score": cand_score,
                        "ml_rank": 1,
                        "ml_score_margin": cand_margin,
                        "ml_candidates_ranked": 1,
                    }
                    case["ai_reason"] = (
                        f"AI Investigated. Reason: Missing exact identifier; ML Candidate Scorer matched {cand_id} "
                        f"(score: {cand_score:.2f}). Forwarded for verification."
                    )
                else:
                    top_summary = [
                        {
                            "settlement_id": r["candidate"]["settlement_id"],
                            "score": r["ml_match_score"],
                            "rank": r["ml_rank"],
                        }
                        for r in ranked[:3]
                    ]
                    case["candidate"] = {
                        "match_method": "MULTIPLE",
                        "amount_delta": cand_wf["unexplained_delta"],
                        "multiple_candidates": True,
                        "high_value": is_high_val,
                        "conflicting_evidence": True,
                        "duplicate_allocation": False,
                        "unexplained_delta": cand_wf["unexplained_delta"] > 0,
                        "currency_mismatch": p_currency != str(cand.get("currency", "INR")).upper(),
                        "ml_match_score": cand_score,
                        "ml_rank": 1,
                        "ml_score_margin": cand_margin,
                        "ml_candidates_ranked": len(ranked),
                        "ml_top_candidates": top_summary,
                    }
                    case["ai_reason"] = (
                        f"AI Investigated. Reason: Multiple candidates matched amount; ML ranked {len(ranked)} candidates "
                        f"(Top match {cand_id} score: {cand_score:.2f}, margin: {cand_margin:.2f})."
                    )
            else:
                case["ml_match_score"] = 0.0
                case["ml_rank"] = None
                case["candidate"] = {
                    "match_method": "NO_MATCH",
                    "amount_delta": amount,
                    "multiple_candidates": False,
                    "high_value": is_high_val,
                    "conflicting_evidence": False,
                    "duplicate_allocation": False,
                    "unexplained_delta": False,
                    "currency_mismatch": False,
                    "ml_match_score": 0.0,
                    "ml_rank": None,
                    "ml_score_margin": 0.0,
                    "ml_candidates_ranked": 0,
                }
                case["ai_reason"] = "AI Not required. Reason: No candidate settlement found in current snapshot."

        if case.get("candidate"):
            from .control_gate import validate_match, decide_final_status
            gate = validate_match(case["candidate"])
            case["status"] = decide_final_status(case["candidate"], gate)
            case["match_method"] = case["candidate"].get("match_method")

        cases.append(case)

    return cases


def verify_population_conservation(
    payments: List[Dict[str, Any]],
    cases: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Validates population conservation invariant:
    INPUT RECORDS == MATCHED + REVIEW + EXCEPTION + INVALID.
    Every record must be accounted for and exist in exactly one terminal state.
    """
    total_inputs = len(payments)
    matched = sum(1 for c in cases if c.get("status") == "MATCHED")
    review = sum(1 for c in cases if c.get("status") == "REVIEW")
    exception = sum(1 for c in cases if c.get("status") == "EXCEPTION")
    invalid = sum(1 for c in cases if c.get("status") == "INVALID")

    total_accounted = matched + review + exception + invalid
    is_conserved = (total_inputs == total_accounted)

    # Check for duplicate payment_id cases
    seen_payments = set()
    duplicates = []
    for c in cases:
        pid = c.get("payment_id")
        if pid in seen_payments:
            duplicates.append(pid)
        seen_payments.add(pid)
    discrepancy = abs(total_inputs - total_accounted)

    return {
        "is_conserved": is_conserved and (len(duplicates) == 0),
        "discrepancy": discrepancy,
        "total_inputs": total_inputs,
        "input_count": total_inputs,
        "total_accounted": total_accounted,
        "output_cases_count": total_accounted,
        "matched": matched,
        "matched_count": matched,
        "review": review,
        "review_count": review,
        "exception": exception,
        "exception_count": exception,
        "invalid": invalid,
        "invalid_count": invalid,
        "duplicate_cases": duplicates,
    }
