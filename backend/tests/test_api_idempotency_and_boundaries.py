"""
Tests for API idempotency, boundary condition handling,
empty dataset safety, and mathematical population conservation.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.engine.reconciliation import verify_population_conservation, run_reconciliation


@pytest.fixture
def client():
    return TestClient(app)


def test_empty_dataset_reconciliation(client):
    """
    Ensures reconciling empty lists does not raise UnboundLocalError or 500 error.
    """
    res = client.post("/api/reconciliation/run", json={"payments": [], "settlements": []})
    assert res.status_code == 200
    data = res.json()
    assert data["status"].lower() == "success"
    assert data["total_cases"] == 0
    assert data["matched"] == 0
    assert data["review"] == 0
    assert data["exception"] == 0


def test_repeated_runs_idempotency(client):
    """
    Verifies that running reconciliation repeatedly on the same payments:
    1. Generates deterministic case_ids
    2. Upserts via merge without creating duplicate database rows
    3. Keeps total case count consistent across repeated requests
    """
    payload = {
        "payments": [
            {"payment_id": "PAY_IDEMP_01", "amount": 100000, "currency": "INR", "source": "synthetic"},
            {"payment_id": "PAY_IDEMP_02", "amount": 250000, "currency": "INR", "source": "synthetic"},
        ],
        "settlements": [
            {
                "settlement_id": "SETL_IDEMP_01",
                "payment_reference": "REF-PAY_IDEMP_01",
                "gross_amount": 100000,
                "net_amount": 100000,
                "currency": "INR",
            }
        ],
    }

    # Run 1
    r1 = client.post("/api/reconciliation/run", json=payload)
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["total_cases"] == 2

    # Run 2 with identical data
    r2 = client.post("/api/reconciliation/run", json=payload)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["total_cases"] == 2

    # Query cases endpoint with search filter
    cases_res = client.get("/api/cases?search=PAY_IDEMP")
    assert cases_res.status_code == 200
    cases = cases_res.json()
    idemp_cases = [c for c in cases if c["payment_id"] in ("PAY_IDEMP_01", "PAY_IDEMP_02")]
    # Assert exactly 2 records exist, not 4
    assert len(idemp_cases) == 2


def test_population_conservation_invariant():
    """
    Mathematical proof invariant:
    len(Input) == MATCHED + REVIEW + EXCEPTION + INVALID
    No case may be created out of thin air, duplicated, or dropped.
    """
    payments = [
        {"payment_id": "PAY_P1", "amount": 100000, "currency": "INR"},
        {"payment_id": "PAY_P2", "amount": 200000, "currency": "INR"},
        {"payment_id": "PAY_P3", "amount": 300000, "currency": "INR"},
        {"payment_id": "PAY_P4", "amount": 400000, "currency": "INR"},
    ]
    settlements = [
        {"settlement_id": "SET_S1", "payment_reference": "REF-PAY_P1", "gross_amount": 100000, "net_amount": 100000},
        {"settlement_id": "SET_S2", "payment_reference": "REF-PAY_P2", "gross_amount": 180000, "net_amount": 180000},  # Mismatch
        {"settlement_id": "SET_S3", "payment_reference": "REF-PAY_P3", "gross_amount": 300000, "net_amount": 250000},  # Unexplained delta (50k)
        # PAY_P4 has NO_MATCH
    ]

    cases = run_reconciliation(payments, settlements)
    audit = verify_population_conservation(payments, cases)

    assert audit["is_conserved"] is True
    assert audit["discrepancy"] == 0
    assert audit["input_count"] == 4
    assert audit["output_cases_count"] == 4
    assert audit["matched_count"] == 1
    assert audit["review_count"] == 1  # Amount mismatch
    assert audit["exception_count"] == 2  # Waterfall anomaly + No match


def test_zero_and_negative_amounts_rejected():
    """
    Negative or zero amount payments must be flagged or rejected cleanly.
    """
    payments = [
        {"payment_id": "PAY_ZERO", "amount": 0, "currency": "INR"},
        {"payment_id": "PAY_NEG", "amount": -500, "currency": "INR"},
    ]
    cases = run_reconciliation(payments, [])
    assert len(cases) == 2
    for c in cases:
        assert c["status"] in ("REVIEW", "EXCEPTION")
