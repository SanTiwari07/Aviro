"""
Regression Test Suite for Dashboard Metrics and Razorpay Test Store Data Flow
Verifies fixes for ₹0.00 bug, authoritative SQLite database path,
honest Razorpay provenance, source namespacing, and Control Gate invariants.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.main import app
from backend import database
from backend.integrations.razorpay.sync import RazorpaySyncService


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def db():
    db_session = database.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()


def test_authoritative_database_path():
    """
    Test 1: Verifies database path resolves to the single authoritative database file
    in project root across all working directories.
    """
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    expected_db_path = os.path.abspath(os.path.join(project_root, "arivo.db"))

    assert database.DATABASE_URL.startswith("sqlite:///")
    actual_db_file = database.DATABASE_URL.replace("sqlite:///", "")
    assert os.path.abspath(actual_db_file) == expected_db_path


def test_overview_dashboard_nonzero_metrics(client):
    """
    Test 2: Reconciles synthetic dataset and asserts all dashboard metrics are non-zero
    and mathematically sound.
    """
    # Run reconciliation for synthetic dataset
    res = client.post("/api/reconciliation/run", json={"source": "synthetic"})
    assert res.status_code == 200
    run_data = res.json()
    assert run_data["status"] == "success"
    assert run_data["cases_processed"] > 0
    assert run_data["matched"] > 0

    # Query dashboard for synthetic workspace
    dash_res = client.get("/api/dashboard?source=synthetic")
    assert dash_res.status_code == 200
    d = dash_res.json()

    # Metric counts must be non-zero
    assert d["processed"] > 0
    assert d["total_records"] > 0
    assert d["matched"] > 0
    assert d["review"] > 0
    assert d["exceptions"] > 0

    # Volume and exposure values must be non-zero integer paise
    assert d["total_processed_volume"] > 0
    assert d["matched_volume"] > 0
    assert d["review_volume"] > 0
    assert d["exception_volume"] > 0
    assert d["unresolved_financial_exposure"] > 0

    # Mathematical conservation of exposure
    assert d["unresolved_financial_exposure"] == d["review_volume"] + d["exception_volume"]
    assert d["unresolved_exposure"]["total_paise"] == d["unresolved_financial_exposure"]


def test_dataset_missing_returns_explicit_400(client):
    """
    Test 3: Requesting reconciliation with an unsupported source returns HTTP 400.
    Never silently returns 200 with 0 records.
    """
    res = client.post("/api/reconciliation/run", json={"source": "non_existent_source"})
    assert res.status_code == 400
    assert "Unsupported source" in res.json()["detail"]


def test_razorpay_test_store_sync_and_reconcile(client):
    """
    Test 4: Ingests the Razorpay Test Store data source. Sync returns status SUCCESS
    with payments_fetched > 0, settlements_fetched > 0.
    Reconciliation and dashboard return non-zero metrics for razorpay_test.
    """
    # 1. Trigger Razorpay Test Store sync
    sync_res = client.post("/api/razorpay/sync", json={"mode": "synthetic"})
    assert sync_res.status_code == 200
    s_data = sync_res.json()
    assert s_data["status"] == "SUCCESS"
    assert s_data["source"] == "razorpay_test"
    assert s_data["payments_fetched"] > 0
    assert s_data["settlements_fetched"] > 0

    # 2. Run reconciliation for razorpay_test
    recon_res = client.post("/api/reconciliation/run", json={"source": "razorpay_test"})
    assert recon_res.status_code == 200
    r_data = recon_res.json()
    assert r_data["source"] == "razorpay_test"
    assert r_data["cases_processed"] > 0
    assert r_data["matched"] > 0

    # 3. Query dashboard for razorpay_test
    dash_res = client.get("/api/dashboard?source=razorpay_test")
    assert dash_res.status_code == 200
    d = dash_res.json()
    assert d["source"] == "razorpay_test"
    assert d["total_processed_volume"] > 0
    assert d["matched_volume"] > 0
    assert d["unresolved_financial_exposure"] > 0


def test_razorpay_status_endpoint(client):
    """
    Test 5: /api/razorpay/status returns data source availability, honest mode,
    and never exposes secret key credentials in response body.
    """
    res = client.get("/api/razorpay/status")
    assert res.status_code == 200
    data = res.json()
    assert "source" in data
    assert data["source"] == "razorpay_test"
    assert "mode" in data
    assert data["mode"] in ("synthetic", "live")
    assert "available" in data
    assert data["available"] is True
    assert data["payments"] > 0
    assert data["settlements"] > 0

    # Ensure secret keys are not leaked
    body_text = res.text
    assert "RAZORPAY_KEY_SECRET" not in body_text


def test_workspace_source_filtering(client):
    """
    Test 6: Verifies scoping between synthetic and razorpay_test.
    Synthetic query returns synthetic records; razorpay_test returns razorpay_test records;
    global ('all' or no source) returns combined records.
    """
    syn_dash = client.get("/api/dashboard?source=synthetic").json()
    rzp_dash = client.get("/api/dashboard?source=razorpay_test").json()
    all_dash = client.get("/api/dashboard?source=all").json()

    assert syn_dash["total_records"] > 0
    assert rzp_dash["total_records"] > 0
    assert all_dash["total_records"] >= syn_dash["total_records"]
    assert all_dash["total_records"] >= rzp_dash["total_records"]


def test_database_restart_preserves_dashboard_metrics(client):
    """
    Test 7: Closing and reopening database session preserves all committed metrics identically.
    """
    dash1 = client.get("/api/dashboard?source=synthetic").json()

    # Recreate engine connection pool
    database.engine.dispose()

    dash2 = client.get("/api/dashboard?source=synthetic").json()
    assert dash1["total_processed_volume"] == dash2["total_processed_volume"]
    assert dash1["total_records"] == dash2["total_records"]
    assert dash1["matched_volume"] == dash2["matched_volume"]
    assert dash1["unresolved_financial_exposure"] == dash2["unresolved_financial_exposure"]


def test_unresolved_exposure_invariant(client):
    """
    Test 8: Invariant check: unresolved_financial_exposure == review_volume + exception_volume
    across all workspaces.
    """
    for src in ["synthetic", "razorpay_test", "all"]:
        d = client.get(f"/api/dashboard?source={src}").json()
        assert d["unresolved_financial_exposure"] == d["review_volume"] + d["exception_volume"]
        assert d["unresolved_exposure"]["total_paise"] == d["unresolved_financial_exposure"]


def test_source_record_id_and_provenance(db: Session):
    """
    Test 9: Verifies that every ReconciliationCase has source and source_record_id or payment_id.
    """
    cases = db.query(database.ReconciliationCase).limit(20).all()
    assert len(cases) > 0
    for c in cases:
        assert c.source in ("synthetic", "razorpay_test")
        assert c.payment_id is not None
        if c.source == "razorpay_test":
            assert c.payment_id.startswith("RZP_")


def test_razorpay_id_prefix_prevents_unique_collision(db: Session):
    """
    Test 10: Verifies both synthetic and razorpay_test datasets coexist cleanly
    in SQLite without IntegrityError: UNIQUE constraint failed.
    """
    syn_count = db.query(database.Payment).filter(database.Payment.source == "synthetic").count()
    rzp_count = db.query(database.Payment).filter(database.Payment.source == "razorpay_test").count()

    assert syn_count > 0
    assert rzp_count > 0

    # Ensure no overlap between payment_id sets
    syn_ids = set(r[0] for r in db.query(database.Payment.payment_id).filter(database.Payment.source == "synthetic").all())
    rzp_ids = set(r[0] for r in db.query(database.Payment.payment_id).filter(database.Payment.source == "razorpay_test").all())
    assert len(syn_ids.intersection(rzp_ids)) == 0
