"""
Tests for comprehensive reconciliation engine matching paths,
including exact ID, normalized ID, amount mismatch, high-value boundaries,
waterfall anomalies, and duplicate claim detection.
"""

import pytest
from backend.engine.reconciliation import run_reconciliation, compute_settlement_waterfall, _normalize_ref
from backend.engine.control_gate import validate_match, decide_final_status


def test_exact_match_clean_waterfall():
    payments = [
        {"payment_id": "PAY_EXACT_01", "amount": 100000, "currency": "INR", "source": "synthetic"}
    ]
    settlements = [
        {
            "settlement_id": "SETL_EXACT_01",
            "payment_reference": "REF-PAY_EXACT_01",
            "gross_amount": 100000,
            "fees": 2000,
            "tax": 360,
            "refunds": 0,
            "chargebacks": 0,
            "adjustments": 0,
            "net_amount": 97640,
            "currency": "INR",
        }
    ]
    cases = run_reconciliation(payments, settlements)
    assert len(cases) == 1
    c = cases[0]
    assert c["candidate"]["match_method"] == "EXACT_ID"
    assert c["amount_delta"] == 0
    assert not c["candidate"]["conflicting_evidence"]
    assert not c["candidate"]["unexplained_delta"]

    gate = validate_match(c["candidate"])
    assert gate["result"] == "PASS"
    assert decide_final_status(c["candidate"], gate) == "MATCHED"


def test_normalized_id_resolution():
    payments = [
        {"payment_id": "pay_norm_01", "amount": 50000, "currency": "INR", "reference": "ref_pay norm_01"}
    ]
    settlements = [
        {
            "settlement_id": "SETL_NORM_01",
            "payment_reference": "REF-PAY-NORM-01",
            "gross_amount": 50000,
            "fees": 1000,
            "tax": 180,
            "net_amount": 48820,
            "currency": "INR",
        }
    ]
    cases = run_reconciliation(payments, settlements)
    assert len(cases) == 1
    c = cases[0]
    assert c["candidate"]["match_method"] == "NORMALIZED_ID"
    assert c["settlement_id"] == "SETL_NORM_01"
    assert c["amount_delta"] == 0


def test_amount_mismatch_forces_control_block():
    payments = [
        {"payment_id": "PAY_MISMATCH_01", "amount": 150000, "currency": "INR"}
    ]
    settlements = [
        {
            "settlement_id": "SETL_MISMATCH_01",
            "payment_reference": "REF-PAY_MISMATCH_01",
            "gross_amount": 140000,
            "fees": 2800,
            "tax": 504,
            "net_amount": 136696,
            "currency": "INR",
        }
    ]
    cases = run_reconciliation(payments, settlements)
    c = cases[0]
    assert c["candidate"]["match_method"] == "AMOUNT_MISMATCH"
    assert c["amount_delta"] == 10000
    assert c["candidate"]["conflicting_evidence"] is True

    gate = validate_match(c["candidate"])
    assert gate["result"] == "BLOCK"
    assert decide_final_status(c["candidate"], gate) == "REVIEW"


def test_high_value_boundaries():
    threshold = 5000000
    p_below = {"payment_id": "PAY_BELOW", "amount": threshold - 1, "currency": "INR"}
    p_at = {"payment_id": "PAY_AT", "amount": threshold, "currency": "INR"}
    p_above = {"payment_id": "PAY_ABOVE", "amount": threshold + 1, "currency": "INR"}

    cases = run_reconciliation([p_below, p_at, p_above], [])
    c_map = {c["payment_id"]: c for c in cases}

    assert c_map["PAY_BELOW"]["candidate"]["high_value"] is False
    assert c_map["PAY_AT"]["candidate"]["high_value"] is True
    assert c_map["PAY_ABOVE"]["candidate"]["high_value"] is True


def test_settlement_waterfall_anomalies():
    s_clean = {
        "settlement_id": "SET_CLEAN",
        "gross_amount": 100000,
        "fees": 2000,
        "tax": 360,
        "refunds": 5000,
        "chargebacks": 1000,
        "adjustments": 500,
        "net_amount": 92140,
    }
    wf_clean = compute_settlement_waterfall(s_clean)
    assert wf_clean["unexplained_delta"] == 0
    assert wf_clean["is_balanced"] is True

    s_anomaly = dict(s_clean)
    s_anomaly["net_amount"] = 92040
    wf_anomaly = compute_settlement_waterfall(s_anomaly)
    assert wf_anomaly["unexplained_delta"] == 100
    assert wf_anomaly["is_balanced"] is False


def test_waterfall_anomaly_routes_strictly_to_exception():
    payments = [
        {"payment_id": "PAY_WF_01", "amount": 100000, "currency": "INR"}
    ]
    settlements = [
        {
            "settlement_id": "SET_WF_01",
            "payment_reference": "REF-PAY_WF_01",
            "gross_amount": 100000,
            "fees": 2000,
            "tax": 360,
            "net_amount": 97540,
            "currency": "INR",
        }
    ]
    cases = run_reconciliation(payments, settlements)
    c = cases[0]
    assert c["candidate"]["match_method"] == "WATERFALL_ANOMALY"
    assert c["candidate"]["unexplained_delta"] is True

    gate = validate_match(c["candidate"])
    assert gate["result"] == "BLOCK"
    assert "Unexplained settlement waterfall delta." in gate["reasons"]
    assert decide_final_status(c["candidate"], gate) == "EXCEPTION"


def test_duplicate_payment_claim_detection():
    payments = [
        {"payment_id": "PAY_DUP_1", "amount": 25000, "reference": "ORDER_SHARED_01"},
        {"payment_id": "PAY_DUP_2", "amount": 25000, "reference": "ORDER_SHARED_01"},
    ]
    settlements = [
        {
            "settlement_id": "SET_DUP_01",
            "payment_reference": "ORDER_SHARED_01",
            "gross_amount": 25000,
            "fees": 500,
            "tax": 90,
            "net_amount": 24410,
        }
    ]
    cases = run_reconciliation(payments, settlements)
    assert len(cases) == 2
    for c in cases:
        assert c["candidate"]["duplicate_allocation"] is True
        gate = validate_match(c["candidate"])
        assert gate["result"] == "BLOCK"
        assert decide_final_status(c["candidate"], gate) == "REVIEW"
