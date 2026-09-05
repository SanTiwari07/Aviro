import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, ReconciliationCase, Settlement

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "cases_indexed" in data
    assert "razorpay_configured" in data

def test_razorpay_status_endpoint(client):
    res = client.get("/api/razorpay/status")
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "source_mode" in data

def test_sync_latest_endpoint(client):
    res = client.get("/api/sync/latest")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data

def test_dashboard_endpoint_default(client):
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    for field in [
        "total_records", "matched_count", "review_count", "exception_count",
        "total_processed_volume", "unresolved_financial_exposure", "unresolved_exposure"
    ]:
        assert field in data, f"Missing field {field} in /api/dashboard"
        assert data[field] is not None

def test_dashboard_endpoint_sources(client):
    for source in ["synthetic", "razorpay_test"]:
        res = client.get(f"/api/dashboard?source={source}")
        assert res.status_code == 200
        data = res.json()
        assert "total_records" in data

def test_reconciliation_list_endpoint(client):
    res = client.get("/api/reconciliation?limit=20")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        c = data[0]
        assert "case_id" in c
        assert "status" in c
        assert c["status"] in ["MATCHED", "REVIEW", "EXCEPTION"]

def test_reconciliation_filter_status(client):
    for status in ["MATCHED", "REVIEW", "EXCEPTION"]:
        res = client.get(f"/api/reconciliation?status={status}&limit=5")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        for item in data:
            assert item["status"] == status

def test_reconciliation_search(client):
    res = client.get("/api/reconciliation?search=CASE_&limit=5")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_case_detail_found(client):
    db = SessionLocal()
    case = db.query(ReconciliationCase).first()
    db.close()
    if case:
        res = client.get(f"/api/reconciliation/{case.case_id}")
        assert res.status_code == 200
        data = res.json()
        assert "case" in data
        assert "ai_investigation" in data
        assert "control_gate" in data
        assert data["case"]["case_id"] == case.case_id

def test_case_detail_not_found(client):
    res = client.get("/api/reconciliation/CASE_NON_EXISTENT_999999")
    assert res.status_code == 404

def test_case_resolve_endpoint(client):
    db = SessionLocal()
    case = db.query(ReconciliationCase).first()
    db.close()
    if case:
        res = client.post(
            f"/api/reconciliation/{case.case_id}/resolve",
            json={"action": "APPROVED", "notes": "Automated QA Verification", "user": "QA Engineer"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["success", "resolved"]
        assert data.get("action") == "APPROVED" or data.get("resolution_action") == "APPROVED"
        assert data["new_status"] == "MATCHED"

def test_case_resolve_invalid_action(client):
    db = SessionLocal()
    case = db.query(ReconciliationCase).first()
    db.close()
    if case:
        res = client.post(
            f"/api/reconciliation/{case.case_id}/resolve",
            json={"action": "INVALID_ACTION", "notes": "Test", "user": "QA Engineer"}
        )
        assert res.status_code in [400, 422]

def test_exceptions_list_endpoint(client):
    res = client.get("/api/exceptions?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    for c in data:
        assert c["status"] in ["EXCEPTION", "REVIEW"]

def test_exceptions_export_csv(client):
    res = client.get("/api/exceptions/export")
    assert res.status_code == 200
    assert "text/csv" in res.headers.get("content-type", "")
    assert "attachment" in res.headers.get("content-disposition", "")
    lines = res.text.strip().split("\r\n") if "\r\n" in res.text else res.text.strip().split("\n")
    assert len(lines) >= 1
    header = lines[0]
    assert "Case ID" in header or "case_id" in header.lower()

def test_settlements_list_endpoint(client):
    res = client.get("/api/settlements?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        s = data[0]
        assert "settlement_id" in s
        assert "gross_amount" in s
        assert "net_amount" in s

def test_settlement_detail_found(client):
    db = SessionLocal()
    s = db.query(Settlement).first()
    db.close()
    if s:
        res = client.get(f"/api/settlements/{s.settlement_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["settlement_id"] == s.settlement_id

def test_settlement_detail_not_found(client):
    res = client.get("/api/settlements/SETTLE_NON_EXISTENT_999999")
    assert res.status_code == 404

def test_forecast_endpoint(client):
    res = client.get("/api/forecast")
    assert res.status_code == 200
    data = res.json()
    for field in ["confirmed_cash", "expected_settlements", "seven_day_expected_inflow", "projections"]:
        assert field in data
    assert isinstance(data["projections"], list)

def test_health_controls_endpoint(client):
    res = client.get("/api/health/controls")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "checks" in data

def test_runs_endpoint(client):
    res = client.get("/api/runs?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        r = data[0]
        assert "run_id" in r
        assert "records_processed" in r

def test_benchmark_endpoint(client):
    res = client.get("/api/benchmark")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert "baseline" in data["metrics"]
    assert "arivo" in data["metrics"]
    assert "flagship_safety_demo" in data

def test_policies_endpoint(client):
    res = client.get("/api/policies")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "policies" in data
    assert isinstance(data["policies"], list)

def test_ask_endpoint_fallback(client):
    res = client.post("/api/ask", json={"question": "What is the policy for high value transactions?"})
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert "records" in data
    assert "policies" in data
    assert "classification" in data
    assert "recommended_actions" in data
    assert "grounded" in data
