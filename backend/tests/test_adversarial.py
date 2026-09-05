from backend.engine.control_gate import validate_match, decide_final_status
from backend.engine.reconciliation import run_reconciliation


def test_flagship_ai_safety_demo():
    """
    Core demo invariant:
    'The AI is confident. The system is not.'
    Gemini assesses 97% confidence MATCH on a high-value transaction with candidate ambiguity.
    The deterministic Control Gate issues an authoritative BLOCK, enforcing REVIEW.
    """
    candidate = {
        "match_method": "AMOUNT_DATE",
        "amount_delta": 0,
        "multiple_candidates": True,  # Ambiguity
        "high_value": True,           # High-value >= 50,000 INR
        "conflicting_evidence": True,
        "ai_recommendation": "MATCHED",
        "ai_confidence": 0.97,
    }

    # 1. Authoritative Control Gate validation
    gate_result = validate_match(candidate)
    assert gate_result["result"] == "BLOCK"
    assert "Multiple candidate settlements." in gate_result["reasons"]
    assert "High-value transaction with candidate ambiguity." in gate_result["reasons"]

    # 2. Final Decision: BLOCK overrides AI recommendation
    final_status = decide_final_status(candidate, gate_result)
    assert final_status == "REVIEW"
    assert final_status != "MATCHED"


def test_duplicate_settlement_allocation_prevented():
    """
    Ensures that a single settlement record cannot be allocated to multiple payments.
    """
    payments = [
        {"payment_id": "PAY_A", "amount": 10000, "source": "synthetic"},
        {"payment_id": "PAY_B", "amount": 10000, "source": "synthetic"},
    ]
    settlements = [
        {
            "settlement_id": "SETL_SINGLE",
            "gross_amount": 10000,
            "payment_reference": "REF-PAY_A",
            "source": "synthetic",
        }
    ]

    cases = run_reconciliation(payments, settlements)
    assert len(cases) == 2

    # First payment matches settlement
    case_a = next(c for c in cases if c["payment_id"] == "PAY_A")
    assert case_a["settlement_id"] == "SETL_SINGLE"

    # Second payment must NOT steal or re-allocate the already-allocated settlement
    case_b = next(c for c in cases if c["payment_id"] == "PAY_B")
    assert case_b["settlement_id"] is None
    assert case_b["candidate"]["match_method"] == "NO_MATCH"


def test_unexplained_delta_forces_exception_or_review():
    """
    Non-zero discrepancy between payment amount and settlement gross amount
    cannot pass the Control Gate.
    """
    candidate = {
        "match_method": "AMOUNT_MISMATCH",
        "amount_delta": 4500,  # 45 INR discrepancy
        "multiple_candidates": False,
        "high_value": False,
        "conflicting_evidence": True,
        "ai_recommendation": "MATCHED",
    }

    gate_result = validate_match(candidate)
    assert gate_result["result"] == "BLOCK"
    assert "Non-zero amount delta." in gate_result["reasons"]

    final_status = decide_final_status(candidate, gate_result)
    assert final_status == "REVIEW"
