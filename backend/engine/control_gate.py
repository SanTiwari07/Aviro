from typing import Dict, Any


def validate_match(candidate: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic Control Gate to authorize or block a match.

    candidate expects:
    - match_method: str
    - amount_delta: int
    - multiple_candidates: bool
    - high_value: bool
    - conflicting_evidence: bool
    - ai_recommendation: Optional[str]
    """
    reasons = []

    if candidate.get("amount_delta", 0) != 0:
        reasons.append("Non-zero amount delta.")

    if candidate.get("multiple_candidates", False):
        reasons.append("Multiple candidates.")

    if candidate.get("high_value", False):
        reasons.append("High-value transaction.")

    if candidate.get("conflicting_evidence", False):
        reasons.append("Conflicting evidence.")

    if len(reasons) > 0:
        return {"result": "BLOCK", "reasons": reasons}

    return {"result": "PASS", "reasons": []}


def decide_final_status(candidate: Dict[str, Any], control_result: Dict[str, Any]) -> str:
    """
    Final decision based on Gemini recommendation and Control Gate.
    Control Gate is always authoritative — a BLOCK cannot be overridden.
    """
    if control_result["result"] == "BLOCK":
        # Even if AI recommends MATCHED, control gate overrides
        ai_rec = candidate.get("ai_recommendation")
        if ai_rec == "EXCEPTION":
            return "EXCEPTION"
        return "REVIEW"

    # Control passes — check deterministic match method first
    match_method = candidate.get("match_method")
    if match_method in ("EXACT_ID", "NORMALIZED_ID", "GROUPED"):
        return "MATCHED"

    # Fallback to AI recommendation (BUG FIX: was "MATCH", must be "MATCHED")
    ai_rec = candidate.get("ai_recommendation")
    if ai_rec == "MATCHED":
        return "MATCHED"
    if ai_rec == "EXCEPTION":
        return "EXCEPTION"

    return "REVIEW"
