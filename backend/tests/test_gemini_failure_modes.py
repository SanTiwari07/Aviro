"""
Comprehensive test suite for Gemini AI parser safety contract and failure modes.
Validates all 22 edge cases, format errors, hallucination attempts, and fallback resilience.
"""

import pytest
from unittest.mock import patch, MagicMock
from backend.ai.gemini import (
    validate_gemini_case_response,
    parse_gemini_response_safe,
    investigate_case,
)


@pytest.fixture
def sample_case():
    return {
        "case_id": "CASE_TEST_01",
        "payment_id": "PAY_VALID_123",
        "settlement_id": "SETL_VALID_456",
        "amount": 100000,
        "amount_delta": 0,
        "candidate": {
            "match_method": "AMOUNT_DATE",
            "candidate_settlement_ids": ["SETL_VALID_456", "SETL_ALT_789"],
        },
    }


# 1. Empty string response raises ValueError and safe parser catches it
def test_mode_01_empty_string(sample_case):
    with pytest.raises(ValueError, match="Empty response text"):
        validate_gemini_case_response("", sample_case)
    safe = parse_gemini_response_safe("", sample_case)
    assert safe["recommended_decision"] == "REVIEW"
    assert safe["confidence"] == 0.0


# 2. Whitespace-only response
def test_mode_02_whitespace_only(sample_case):
    with pytest.raises(ValueError, match="Empty response text"):
        validate_gemini_case_response("   \n\t  ", sample_case)
    safe = parse_gemini_response_safe("   \n\t  ", sample_case)
    assert safe["recommended_decision"] == "REVIEW"
    assert safe["confidence"] == 0.0


# 3. Markdown code fences ```json ... ``` correctly stripped
def test_mode_03_markdown_code_fences(sample_case):
    raw = """```json
    {
        "recommended_decision": "MATCHED",
        "confidence": 0.95,
        "summary": "Clear match",
        "payment_id": "PAY_VALID_123",
        "settlement_id": "SETL_VALID_456"
    }
    ```"""
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["recommended_decision"] == "MATCHED"
    assert parsed["confidence"] == 0.95


# 4. Inline markdown fences ```json{...}```
def test_mode_04_inline_markdown_fences(sample_case):
    raw = "```json{\"recommended_decision\": \"REVIEW\", \"confidence\": 0.8, \"summary\": \"Ok\"}```"
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["recommended_decision"] == "REVIEW"
    assert parsed["confidence"] == 0.8


# 5. Malformed syntax JSON (truncated/missing braces)
def test_mode_05_malformed_syntax_json(sample_case):
    raw = '{"recommended_decision": "MATCHED", "confidence": 0.9, '
    with pytest.raises(ValueError, match="Malformed JSON"):
        validate_gemini_case_response(raw, sample_case)
    safe = parse_gemini_response_safe(raw, sample_case)
    assert safe["recommended_decision"] == "REVIEW"
    assert safe["confidence"] == 0.0


# 6. JSON array instead of object
def test_mode_06_json_array_instead_of_object(sample_case):
    raw = '[{"recommended_decision": "MATCHED"}]'
    with pytest.raises(ValueError, match="not a JSON object"):
        validate_gemini_case_response(raw, sample_case)


# 7. Primitive JSON types (number, string, boolean)
def test_mode_07_primitive_json_types(sample_case):
    for prim in ["12345", '"MATCHED"', "true"]:
        with pytest.raises(ValueError, match="not a JSON object"):
            validate_gemini_case_response(prim, sample_case)


# 8. Missing recommended_decision field
def test_mode_08_missing_decision_field(sample_case):
    raw = '{"confidence": 0.95, "summary": "Looks good"}'
    with pytest.raises(ValueError, match="Invalid recommended_decision"):
        validate_gemini_case_response(raw, sample_case)


# 9. Invalid decision enum (e.g. "APPROVE_PAYOUT")
def test_mode_09_invalid_decision_enum(sample_case):
    raw = '{"recommended_decision": "APPROVE_PAYOUT", "confidence": 0.95}'
    with pytest.raises(ValueError, match="Invalid recommended_decision"):
        validate_gemini_case_response(raw, sample_case)


# 10. Lowercase decision normalization
def test_mode_10_lowercase_decision_normalization(sample_case):
    raw = '{"recommended_decision": "matched", "confidence": 0.92, "payment_id": "PAY_VALID_123"}'
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["recommended_decision"] == "MATCHED"
    assert parsed["confidence"] == 0.92


# 11. Missing confidence field defaults to 0.0
def test_mode_11_missing_confidence_field(sample_case):
    raw = '{"recommended_decision": "MATCHED", "payment_id": "PAY_VALID_123"}'
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["recommended_decision"] == "MATCHED"
    assert parsed["confidence"] == 0.0


# 12. Numeric string confidence parsing
def test_mode_12_numeric_string_confidence(sample_case):
    raw = '{"recommended_decision": "MATCHED", "confidence": "0.85", "payment_id": "PAY_VALID_123"}'
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["confidence"] == 0.85


# 13. Non-numeric string confidence
def test_mode_13_non_numeric_string_confidence(sample_case):
    raw = '{"recommended_decision": "MATCHED", "confidence": "very high", "payment_id": "PAY_VALID_123"}'
    with pytest.raises(ValueError, match="Non-numeric confidence"):
        validate_gemini_case_response(raw, sample_case)


# 14. Confidence clamping above 1.0
def test_mode_14_confidence_clamping_above_one(sample_case):
    raw = '{"recommended_decision": "MATCHED", "confidence": 1.45, "payment_id": "PAY_VALID_123"}'
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["confidence"] == 1.0


# 15. Confidence clamping below 0.0
def test_mode_15_confidence_clamping_below_zero(sample_case):
    raw = '{"recommended_decision": "MATCHED", "confidence": -0.5, "payment_id": "PAY_VALID_123"}'
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["confidence"] == 0.0


# 16. Non-finite confidence (NaN, Infinity)
def test_mode_16_non_finite_confidence(sample_case):
    raw = '{"recommended_decision": "MATCHED", "confidence": "nan", "payment_id": "PAY_VALID_123"}'
    with pytest.raises(ValueError, match="Confidence is NaN or Infinity"):
        validate_gemini_case_response(raw, sample_case)


# 17. Missing summary fallback
def test_mode_17_missing_summary_fallback(sample_case):
    raw = '{"recommended_decision": "EXCEPTION", "confidence": 0.88}'
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["summary"] != ""
    assert isinstance(parsed["summary"], str)


# 18. Missing evidence lists defaults to empty lists
def test_mode_18_missing_evidence_lists(sample_case):
    raw = '{"recommended_decision": "REVIEW", "confidence": 0.5}'
    parsed = validate_gemini_case_response(raw, sample_case)
    assert parsed["supporting_evidence"] == []
    assert parsed["contradicting_evidence"] == []


# 19. Non-list evidence coercion to list
def test_mode_19_non_list_evidence_coercion(sample_case):
    raw = '{"recommended_decision": "REVIEW", "confidence": 0.5, "supporting_evidence": "Found reference"}'
    parsed = validate_gemini_case_response(raw, sample_case)
    assert isinstance(parsed["supporting_evidence"], list)
    assert parsed["supporting_evidence"] == ["Found reference"]


# 20. Hallucinated payment_id rejection
def test_mode_20_hallucinated_payment_id(sample_case):
    raw = '{"recommended_decision": "MATCHED", "confidence": 0.99, "payment_id": "PAY_HALLUCINATED_999"}'
    with pytest.raises(ValueError, match="Hallucinated payment_id"):
        validate_gemini_case_response(raw, sample_case)


# 21. Hallucinated settlement_id rejection
def test_mode_21_hallucinated_settlement_id(sample_case):
    raw = '{"recommended_decision": "MATCHED", "confidence": 0.99, "payment_id": "PAY_VALID_123", "settlement_id": "SETL_HALLUCINATED_999"}'
    with pytest.raises(ValueError, match="Hallucinated settlement_id"):
        validate_gemini_case_response(raw, sample_case)


# 22. Network exception / timeout handling in investigate_case
def test_mode_22_api_exception_fallback(sample_case):
    with patch("backend.ai.gemini._get_client", side_effect=Exception("Connection timed out")):
        res = investigate_case(sample_case)
        assert res["recommended_decision"] == "REVIEW"
        assert res["confidence"] == 0.0
        assert "Gemini investigation unavailable" in res["summary"]
