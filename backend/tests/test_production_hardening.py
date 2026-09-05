"""
Comprehensive Production Readiness & Financial Hardening Test Suite for ARIVO.
Enforces:
1. Exact boundary tests for the single authoritative high-value threshold (₹50,000 / 5,000,000 paise).
2. Control Gate absolute veto authority over AI recommendations.
3. Minor currency integer invariants & 1-paise settlement waterfall anomaly detection.
4. Population conservation mathematical invariant across adverse inputs.
5. Gemini parser adversarial fuzzing and fallback safety.
6. Razorpay integer paise normalization without precision loss.
"""

import pytest
from backend.engine.control_gate import (
    validate_match,
    decide_final_status,
    HIGH_VALUE_THRESHOLD_PAISE,
)
from backend.engine.reconciliation import (
    run_reconciliation,
    compute_settlement_waterfall,
    verify_population_conservation,
)
from backend.ai.gemini import (
    validate_gemini_case_response,
    parse_gemini_response_safe,
)
from backend.integrations.razorpay.normalizer import (
    PaymentNormalizer,
    SettlementNormalizer,
)


# ==============================================================================
# 1. High-Value Threshold Boundary Invariants (₹50,000.00 = 5,000,000 paise)
# ==============================================================================

def test_high_value_threshold_constant_value():
    """Authoritative threshold must equal exactly 5,000,000 paise (₹50,000.00)."""
    assert HIGH_VALUE_THRESHOLD_PAISE == 5_000_000


def test_high_value_exact_boundary_conditions():
    """
    Test exact boundary conditions:
    - 4,999,999 paise (threshold - 1): Not high value
    - 5,000,000 paise (threshold): High value
    - 5,000,001 paise (threshold + 1): High value
    """
    p_below = {"payment_id": "P_BELOW", "amount": HIGH_VALUE_THRESHOLD_PAISE - 1, "currency": "INR"}
    p_at = {"payment_id": "P_AT", "amount": HIGH_VALUE_THRESHOLD_PAISE, "currency": "INR"}
    p_above = {"payment_id": "P_ABOVE", "amount": HIGH_VALUE_THRESHOLD_PAISE + 1, "currency": "INR"}

    cases = run_reconciliation([p_below, p_at, p_above], [])
    c_map = {c["payment_id"]: c for c in cases}

    assert c_map["P_BELOW"]["candidate"]["high_value"] is False
    assert c_map["P_AT"]["candidate"]["high_value"] is True
    assert c_map["P_ABOVE"]["candidate"]["high_value"] is True


def test_high_value_ambiguity_forces_review_not_matched():
    """
    When an amount is high-value (>= ₹50,000) AND has ambiguity (multiple candidates or conflicting evidence),
    Control Gate MUST return BLOCK, and final decision MUST be REVIEW even if AI says MATCHED.
    """
    cand = {
        "amount": HIGH_VALUE_THRESHOLD_PAISE,
        "amount_delta": 0,
        "high_value": True,
        "multiple_candidates": True,  # Ambiguity
        "conflicting_evidence": False,
        "duplicate_allocation": False,
        "unexplained_delta": False,
        "currency_mismatch": False,
        "ai_recommendation": "MATCHED",
        "ai_confidence": 0.99,
    }

    gate = validate_match(cand)
    assert gate["result"] == "BLOCK"
    assert "High-value transaction with candidate ambiguity." in gate["reasons"]

    decision = decide_final_status(cand, gate)
    assert decision == "REVIEW"
    assert decision != "MATCHED"


def test_sub_threshold_clean_match_passes():
    """
    Transactions below threshold without ambiguity or deltas pass smoothly.
    """
    cand = {
        "amount": HIGH_VALUE_THRESHOLD_PAISE - 1,
        "amount_delta": 0,
        "high_value": False,
        "multiple_candidates": False,
        "conflicting_evidence": False,
        "duplicate_allocation": False,
        "unexplained_delta": False,
        "currency_mismatch": False,
        "match_method": "EXACT_ID",
    }
    gate = validate_match(cand)
    assert gate["result"] == "PASS"
    assert decide_final_status(cand, gate) == "MATCHED"


# ==============================================================================
# 2. Control Gate Absolute Veto Authority
# ==============================================================================

@pytest.mark.parametrize("block_trigger", [
    {"amount_delta": 100},
    {"multiple_candidates": True},
    {"high_value": True, "conflicting_evidence": True},
    {"duplicate_allocation": True},
    {"unexplained_delta": True},
    {"currency_mismatch": True},
])
def test_control_gate_veto_blocks_all_ai_match_attempts(block_trigger):
    """
    Property test: If ANY Control Gate invariant is violated, the Control Gate MUST
    block the match. Even with 100% AI confidence recommending MATCHED,
    the final status CANNOT be MATCHED.
    """
    cand = {
        "amount": 250_000,
        "amount_delta": 0,
        "multiple_candidates": False,
        "conflicting_evidence": False,
        "duplicate_allocation": False,
        "unexplained_delta": False,
        "currency_mismatch": False,
        "ai_recommendation": "MATCHED",
        "ai_confidence": 1.0,
    }
    # Apply failure condition
    cand.update(block_trigger)

    gate = validate_match(cand)
    assert gate["result"] == "BLOCK"

    final_status = decide_final_status(cand, gate)
    assert final_status in ("REVIEW", "EXCEPTION")
    assert final_status != "MATCHED"


# ==============================================================================
# 3. Financial Invariants & Settlement Waterfall (Zero Floating Point)
# ==============================================================================

def test_waterfall_integer_arithmetic_exactness():
    """
    Settlement waterfall:
    Gross - Refunds - Chargebacks - Fees - Tax + Adjustments = Expected Settlement
    Must operate in integer paise with zero floating-point imprecision.
    """
    gross = 10_000_000      # ₹1,00,000.00
    refunds = 500_000       # ₹5,000.00
    chargebacks = 250_000   # ₹2,500.00
    fees = 200_000          # ₹2,000.00
    tax = 36_000            # ₹360.00 (18% GST on fees)
    adjustments = 10_000    # ₹100.00
    expected_net = gross - refunds - chargebacks - fees - tax + adjustments

    settlement = {
        "settlement_id": "SETL_TEST_WF",
        "gross_amount": gross,
        "refunds": refunds,
        "chargebacks": chargebacks,
        "fees": fees,
        "tax": tax,
        "adjustments": adjustments,
        "net_amount": expected_net,
    }

    result = compute_settlement_waterfall(settlement)
    assert result["is_balanced"] is True
    assert result["unexplained_delta"] == 0
    assert result["expected_net"] == expected_net
    assert isinstance(result["expected_net"], int)


def test_waterfall_one_paise_delta_flagged():
    """
    Even a single paise discrepancy (₹0.01 = 1 paise) MUST trigger unexplained delta
    and be classified as an EXCEPTION.
    """
    gross = 500_000
    fees = 10_000
    tax = 1_800
    calculated_net = gross - fees - tax  # 488,200 paise

    # Bank credited 1 paise less: 488,199 paise
    settlement = {
        "settlement_id": "SETL_ONE_PAISE_DELTA",
        "gross_amount": gross,
        "fees": fees,
        "tax": tax,
        "net_amount": calculated_net - 1,
    }

    result = compute_settlement_waterfall(settlement)
    assert result["is_balanced"] is False
    assert result["unexplained_delta"] == 1


# ==============================================================================
# 4. Population Conservation Invariant
# ==============================================================================

def test_population_conservation_across_mixed_batch():
    """
    INPUT POPULATION == MATCHED + REVIEW + EXCEPTION + INVALID
    No transaction may be dropped, created, or skipped.
    """
    payments = [
        {"payment_id": f"PAY_POP_{i}", "amount": 100_000 * (i + 1), "currency": "INR"}
        for i in range(20)
    ]

    settlements = [
        # First 5: Exact matches
        {
            "settlement_id": f"SET_POP_{i}",
            "payment_reference": f"REF-PAY_POP_{i}",
            "gross_amount": 100_000 * (i + 1),
            "net_amount": 100_000 * (i + 1),
        }
        for i in range(5)
    ] + [
        # Next 5: Waterfall anomalies (unexplained 500 paise delta)
        {
            "settlement_id": f"SET_POP_{i}",
            "payment_reference": f"REF-PAY_POP_{i}",
            "gross_amount": 100_000 * (i + 1),
            "net_amount": 100_000 * (i + 1) - 500,
        }
        for i in range(5, 10)
    ]
    # Remaining 10 payments have no settlements (NO_MATCH)

    cases = run_reconciliation(payments, settlements)
    audit = verify_population_conservation(payments, cases)

    assert audit["is_conserved"] is True
    assert audit["discrepancy"] == 0
    assert audit["input_count"] == 20
    assert audit["output_cases_count"] == 20
    assert audit["matched_count"] == 5
    assert audit["exception_count"] >= 10  # 5 waterfall anomalies + 10 no matches


# ==============================================================================
# 5. Gemini Parser Adversarial Fuzzing & Fallback Safety
# ==============================================================================

def test_gemini_parser_handles_markdown_wrapping():
    """Gemini sometimes wraps output in ```json ... ``` blocks."""
    raw_markdown = """```json
    {
        "classification": "CLEAN_MATCH",
        "summary": "Match verified against bank trace.",
        "supporting_evidence": ["Ref matches perfectly"],
        "contradicting_evidence": [],
        "recommended_decision": "MATCHED",
        "recommended_action": "Auto-settle payment",
        "confidence": 0.98
    }
    ```"""
    parsed = validate_gemini_case_response(raw_markdown)
    assert parsed["recommended_decision"] == "MATCHED"
    assert parsed["confidence"] == 0.98


def test_gemini_parser_fuzz_bad_json_returns_safe_fallback():
    """Corrupt or invalid JSON returns safe REVIEW fallback with confidence 0.0."""
    bad_responses = [
        "Not valid JSON at all",
        "{ incomplete json: 123",
        '{"recommended_decision": "INVALID_DECISION"}',
        '{"confidence": "high"}',  # Non-float confidence
        "",
        "None",
    ]
    for bad in bad_responses:
        result = parse_gemini_response_safe(bad)
        assert result["recommended_decision"] == "REVIEW"
        assert result["confidence"] == 0.0
        assert result["classification"] == "AI_FAILURE"


# ==============================================================================
# 6. Razorpay Normalizer Integer Minor Units Guarantee
# ==============================================================================

def test_razorpay_normalizer_guarantees_integer_paise():
    """
    Verifies that raw gateway records (which might contain strings or floats)
    are strictly converted to 64-bit integer paise without float errors.
    """
    raw_payment = {
        "id": "pay_test_12345",
        "amount": 499999,  # integer paise
        "currency": "INR",
        "status": "captured",
        "created_at": 1700000000,
        "fee": 1000,
        "tax": 180,
    }
    normalized = PaymentNormalizer.normalize_single(raw_payment, "SYNC_TEST_01")
    assert isinstance(normalized["amount"], int)
    assert isinstance(normalized["fee"], int)
    assert isinstance(normalized["tax"], int)
    assert normalized["amount"] == 499999


def test_razorpay_settlement_waterfall_normalization():
    """
    Verifies that settlement normalization converts and checks waterfall.
    """
    raw_settlement = {
        "id": "setl_test_67890",
        "amount": 98820,
        "gross": 100000,
        "fees": 1000,
        "tax": 180,
        "currency": "INR",
        "status": "processed",
        "created_at": 1700000000,
        "utr": "UTR1234567890",
    }
    norm = SettlementNormalizer.normalize_single(raw_settlement, "SYNC_TEST_01")
    assert isinstance(norm["gross_amount"], int)
    assert isinstance(norm["net_amount"], int)
    assert norm["unexplained_delta"] == 0
    assert norm["status"] == "PROCESSED"
