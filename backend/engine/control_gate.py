"""
Authoritative Control Gate validating financial invariants before allowing any match.
AI investigates ambiguity, but Control Gate retains absolute veto authority.
"""

from typing import Dict, Any, List


def validate_match(candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic Control Gate to authorize or block a candidate match.
    Enforces financial invariants:
    - Zero amount delta
    - Single candidate
    - Value threshold limits (ambiguous high-value records require review)
    - Absence of conflicting evidence
    - Duplicate settlement allocation protection
    - Settlement waterfall consistency
    - Currency compatibility
    """
    reasons: List[str] = []

    if candidate.get("amount_delta", 0) != 0:
        reasons.append("Non-zero amount delta.")

    if candidate.get("multiple_candidates", False):
        reasons.append("Multiple candidate settlements.")

    if candidate.get("high_value", False):
        # If high-value has any ambiguity or missing exact ID, block
        if candidate.get("conflicting_evidence", False) or candidate.get("multiple_candidates", False):
            reasons.append("High-value transaction with candidate ambiguity.")
        elif candidate.get("match_method") != "EXACT_ID":
            reasons.append("High-value transaction without exact identifier.")

    if candidate.get("conflicting_evidence", False):
        reasons.append("Conflicting evidence detected.")

    if candidate.get("duplicate_allocation", False):
        reasons.append("Duplicate settlement allocation detected.")

    if candidate.get("unexplained_delta", False):
        reasons.append("Unexplained settlement waterfall delta.")

    if candidate.get("currency_mismatch", False):
        reasons.append("Currency mismatch between payment and settlement.")

    if reasons:
        return {"result": "BLOCK", "reasons": reasons}

    return {"result": "PASS", "reasons": []}


def decide_final_status(candidate: Dict[str, Any], control_result: Dict[str, Any]) -> str:
    """
    Final decision based on deterministic controls and Gemini recommendation.
    The Control Gate is strictly authoritative:
    If Control Gate = BLOCK, the decision CANNOT become MATCHED even if Gemini confidence is 100%.
    """
    if control_result.get("result") == "BLOCK":
        ai_rec = candidate.get("ai_recommendation")
        if ai_rec == "EXCEPTION":
            return "EXCEPTION"
        return "REVIEW"

    # Control passes — check deterministic match method first
    match_method = candidate.get("match_method")
    if match_method in ("EXACT_ID", "NORMALIZED_ID", "GROUPED"):
        return "MATCHED"

    # AI recommendation path
    ai_rec = candidate.get("ai_recommendation")
    if ai_rec == "MATCHED":
        return "MATCHED"
    if ai_rec == "EXCEPTION":
        return "EXCEPTION"

    return "REVIEW"
