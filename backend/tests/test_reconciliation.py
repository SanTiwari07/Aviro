import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.reconciliation import run_reconciliation
from engine.control_gate import validate_match, decide_final_status


def test_exact_match():
    payments = [{
        "payment_id": "PAY_1",
        "amount": 1000,
    }]
    settlements = [{
        "settlement_id": "SET_1",
        "gross_amount": 1000,
        "payment_reference": "REF-PAY_1"
    }]

    cases = run_reconciliation(payments, settlements)
    assert len(cases) == 1
    assert cases[0]["candidate"]["match_method"] == "EXACT_ID"
    assert cases[0]["candidate"]["conflicting_evidence"] is False

    control = validate_match(cases[0]["candidate"])
    assert control["result"] == "PASS"

    status = decide_final_status(cases[0]["candidate"], control)
    assert status == "MATCHED"


def test_amount_mismatch():
    payments = [{
        "payment_id": "PAY_1",
        "amount": 1000,
    }]
    settlements = [{
        "settlement_id": "SET_1",
        "gross_amount": 900,
        "payment_reference": "REF-PAY_1"
    }]

    cases = run_reconciliation(payments, settlements)
    assert len(cases) == 1
    assert cases[0]["candidate"]["match_method"] == "AMOUNT_MISMATCH"
    assert cases[0]["candidate"]["conflicting_evidence"] is True

    control = validate_match(cases[0]["candidate"])
    assert control["result"] == "BLOCK"
    assert "Non-zero amount delta." in control["reasons"]

    status = decide_final_status(cases[0]["candidate"], control)
    assert status == "REVIEW"


def test_control_gate_high_value_block():
    candidate = {
        "match_method": "EXACT_ID",
        "amount_delta": 0,
        "multiple_candidates": False,
        "high_value": True,
        "conflicting_evidence": False,
        "ai_recommendation": "MATCHED"
    }
    control = validate_match(candidate)
    assert control["result"] == "BLOCK"
    assert "High-value transaction." in control["reasons"]

    # Authority of Control Gate: Even if AI says MATCHED, control gate BLOCK forces REVIEW
    status = decide_final_status(candidate, control)
    assert status == "REVIEW"


def test_ai_matched_decision_pass():
    candidate = {
        "match_method": "AMOUNT_DATE",
        "amount_delta": 0,
        "multiple_candidates": False,
        "high_value": False,
        "conflicting_evidence": False,
        "ai_recommendation": "MATCHED"
    }
    control = validate_match(candidate)
    assert control["result"] == "PASS"

    status = decide_final_status(candidate, control)
    assert status == "MATCHED"


def test_ai_exception_decision():
    candidate = {
        "match_method": "NO_MATCH",
        "amount_delta": 5000,
        "multiple_candidates": False,
        "high_value": False,
        "conflicting_evidence": False,
        "ai_recommendation": "EXCEPTION"
    }
    control = validate_match(candidate)
    status = decide_final_status(candidate, control)
    assert status == "EXCEPTION"
