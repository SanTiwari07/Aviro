"""
Tests for grouped reconciliation (one-to-many split settlements and many-to-one batch payouts),
asserting minor-unit population conservation and sum invariance.
"""

import pytest
from backend.engine.reconciliation import reconcile_grouped, run_reconciliation
from backend.engine.control_gate import validate_match, decide_final_status


def test_one_to_many_split_settlement_success():
    parent_payment = {
        "payment_id": "PAY_SPLIT_01",
        "amount": 1000000,  # 10,000 INR
        "currency": "INR",
    }
    split_settlements = [
        {"settlement_id": "SET_PART_1", "gross_amount": 600000, "fees": 15000, "net_amount": 585000, "currency": "INR"},
        {"settlement_id": "SET_PART_2", "gross_amount": 400000, "fees": 10000, "net_amount": 390000, "currency": "INR"},
    ]
    res = reconcile_grouped([parent_payment], split_settlements, group_type="ONE_TO_MANY")
    assert res["is_conserved"] is True
    assert res["parent_amount"] == 1000000
    assert res["children_sum"] == 1000000
    assert res["discrepancy"] == 0


def test_one_to_many_split_settlement_discrepancy_fails():
    parent_payment = {
        "payment_id": "PAY_SPLIT_DISC",
        "amount": 1000000,
        "currency": "INR",
    }
    # 1 paisa missing! (600,000 + 399,999 = 999,999)
    split_settlements = [
        {"settlement_id": "SET_PART_1", "gross_amount": 600000, "net_amount": 600000, "currency": "INR"},
        {"settlement_id": "SET_PART_2", "gross_amount": 399999, "net_amount": 399999, "currency": "INR"},
    ]
    res = reconcile_grouped([parent_payment], split_settlements, group_type="ONE_TO_MANY")
    assert res["is_conserved"] is False
    assert res["discrepancy"] == 1


def test_many_to_one_batch_settlement_success():
    payments = [
        {"payment_id": "PAY_BATCH_1", "amount": 200000, "currency": "INR"},
        {"payment_id": "PAY_BATCH_2", "amount": 300000, "currency": "INR"},
        {"payment_id": "PAY_BATCH_3", "amount": 500000, "currency": "INR"},
    ]
    batch_settlement = {
        "settlement_id": "SET_BATCH_01",
        "gross_amount": 1000000,
        "net_amount": 1000000,
        "currency": "INR",
    }
    res = reconcile_grouped(payments, [batch_settlement], group_type="MANY_TO_ONE")
    assert res["is_conserved"] is True
    assert res["parent_amount"] == 1000000
    assert res["children_sum"] == 1000000
    assert res["discrepancy"] == 0


def test_reconciliation_engine_grouped_split_execution():
    payments = [
        {"payment_id": "PAY_GRP_01", "amount": 800000, "currency": "INR"}
    ]
    settlements = [
        {
            "settlement_id": "SET_GRP_01_A",
            "payment_reference": "REF-PAY_GRP_01-PART1",
            "gross_amount": 500000,
            "fees": 10000,
            "net_amount": 490000,
            "currency": "INR",
        },
        {
            "settlement_id": "SET_GRP_01_B",
            "payment_reference": "REF-PAY_GRP_01-PART2",
            "gross_amount": 300000,
            "fees": 6000,
            "net_amount": 294000,
            "currency": "INR",
        },
    ]
    cases = run_reconciliation(payments, settlements)
    assert len(cases) == 1
    c = cases[0]
    assert c["candidate"]["match_method"] == "GROUPED"
    assert c["candidate"]["grouped_allocation"] is True
    assert c["candidate"]["settlement_count"] == 2
    assert c["amount_delta"] == 0

    gate = validate_match(c["candidate"])
    assert gate["result"] == "PASS"
    assert decide_final_status(c["candidate"], gate) == "MATCHED"
