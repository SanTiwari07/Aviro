"""
Comprehensive End-to-End Live HTTP API Verification Suite.
Sends real HTTP requests over the wire to http://127.0.0.1:8000
and verifies status codes, JSON structures, schema invariants,
boundary conditions, and error handling.
"""

import json
import urllib.request
import urllib.error
import pytest

BASE_URL = "http://127.0.0.1:8000"


def http_request(path: str, method: str = "GET", data: dict = None, headers: dict = None, timeout: int = 90):
    url = f"{BASE_URL}{path}"
    req_headers = {"Accept": "application/json"}
    if headers:
        req_headers.update(headers)

    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        req_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            try:
                json_data = json.loads(content)
            except Exception:
                json_data = content
            return status, json_data
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            json_data = json.loads(content)
        except Exception:
            json_data = content
        return e.code, json_data


# =========================================================================
# 1. /api/health
# =========================================================================
def test_api_health():
    status, body = http_request("/api/health")
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert isinstance(body, dict)
    assert body.get("status") == "ok"
    assert body.get("service") == "arivo"
    assert "version" in body
    assert body.get("database") == "connected"
    assert "cases_indexed" in body
    assert "razorpay_configured" in body


# =========================================================================
# 2. /api/dashboard
# =========================================================================
def test_api_dashboard_valid():
    status, body = http_request("/api/dashboard")
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert isinstance(body, dict)

    # Check required schema keys
    required_keys = ["processed", "matched", "review", "exceptions", "unresolved_exposure", "cash_position", "control_health", "provider"]
    for key in required_keys:
        assert key in body, f"Missing key in dashboard: {key}"

    # Verify data types and real database aggregation
    assert isinstance(body["processed"], int)
    assert isinstance(body["matched"], int)
    assert isinstance(body["review"], int)
    assert isinstance(body["exceptions"], int)
    assert body["processed"] == body["matched"] + body["review"] + body["exceptions"]

    # Check unresolved exposure
    unresolved = body["unresolved_exposure"]
    assert "total_paise" in unresolved
    assert "total_formatted" in unresolved
    assert isinstance(unresolved["total_paise"], int)

    # Check cash position
    cash = body["cash_position"]
    assert "expected" in cash
    assert "settled" in cash
    assert "unresolved" in cash


def test_api_dashboard_query_params():
    status, body = http_request("/api/dashboard?source=synthetic")
    assert status == 200
    assert isinstance(body, dict)


# =========================================================================
# 3. /api/reconciliation/run
# =========================================================================
def test_api_reconciliation_run():
    # Run pipeline on synthetic dataset
    payload = {"source": "synthetic"}
    status, body = http_request("/api/reconciliation/run", method="POST", data=payload, timeout=90)
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert isinstance(body, dict)
    assert body.get("status") == "success"
    assert "run_id" in body
    assert "cases_processed" in body
    assert "cases_saved" in body
    assert body["cases_processed"] > 0
    assert body["cases_saved"] == body["cases_processed"]
    assert "matched" in body
    assert "review" in body
    assert "exception" in body
    assert body["cases_processed"] == body["matched"] + body["review"] + body["exception"]
    assert "duration_ms" in body
    assert "throughput" in body


def test_api_reconciliation_run_idempotency():
    custom_payload = {
        "source": "synthetic",
        "payments": [
            {"payment_id": "PAY_LIVE_IDEMP_1", "amount": 100000, "currency": "INR", "source": "synthetic"},
            {"payment_id": "PAY_LIVE_IDEMP_2", "amount": 200000, "currency": "INR", "source": "synthetic"},
        ],
        "settlements": [
            {"settlement_id": "SETL_LIVE_IDEMP_1", "payment_reference": "REF-PAY_LIVE_IDEMP_1", "gross_amount": 100000, "net_amount": 100000, "currency": "INR"}
        ],
    }
    # Run 1
    s1, b1 = http_request("/api/reconciliation/run", method="POST", data=custom_payload)
    assert s1 == 200
    assert b1["cases_saved"] == 2

    # Run 2 (repeated)
    s2, b2 = http_request("/api/reconciliation/run", method="POST", data=custom_payload)
    assert s2 == 200
    assert b2["cases_saved"] == 2


# =========================================================================
# 4. /api/reconciliation
# =========================================================================
def test_api_reconciliation_retrieval_and_limits():
    # Default limit
    status, body = http_request("/api/reconciliation")
    assert status == 200
    assert isinstance(body, list)
    assert len(body) > 0
    first_case = body[0]
    assert "case_id" in first_case
    assert "status" in first_case
    assert "payment_id" in first_case

    # Limit = 10
    s_10, b_10 = http_request("/api/reconciliation?limit=10")
    assert s_10 == 200
    assert isinstance(b_10, list)
    assert len(b_10) == 10

    # Limit = 200
    s_200, b_200 = http_request("/api/reconciliation?limit=200")
    assert s_200 == 200
    assert isinstance(b_200, list)
    assert len(b_200) == 200

    # Limit = invalid (should return 422 Unprocessable Entity)
    s_inv, b_inv = http_request("/api/reconciliation?limit=invalid")
    assert s_inv == 422, f"Expected 422, got {s_inv}: {b_inv}"


def test_api_reconciliation_filtering_and_detail():
    # Filter by status=MATCHED
    status, body = http_request("/api/reconciliation?status=MATCHED&limit=5")
    assert status == 200
    for case in body:
        assert case["status"] == "MATCHED"

    # Single case detail
    case_id = body[0]["case_id"]
    s_det, b_det = http_request(f"/api/reconciliation/{case_id}")
    assert s_det == 200
    assert "case" in b_det
    assert b_det["case"]["case_id"] == case_id
    assert "payment" in b_det
    assert "settlement_waterfall" in b_det

    # Non-existent case detail -> 404
    s_404, b_404 = http_request("/api/reconciliation/CASE_NON_EXISTENT_99999")
    assert s_404 == 404


# =========================================================================
# 5. /api/ask
# =========================================================================
def test_api_ask_valid():
    payload = {"question": "Why are unexplained deltas routed to exception?"}
    status, body = http_request("/api/ask", method="POST", data=payload)
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert isinstance(body, dict)
    assert "answer" in body
    assert isinstance(body["answer"], str)
    assert len(body["answer"]) > 0
    assert "referenced_records" in body
    assert isinstance(body["referenced_records"], list)


def test_api_ask_empty_question():
    status, body = http_request("/api/ask", method="POST", data={"question": ""})
    assert status == 400


def test_api_ask_whitespace_question():
    status, body = http_request("/api/ask", method="POST", data={"question": "   \n\t  "})
    assert status == 400


def test_api_ask_missing_question():
    status, body = http_request("/api/ask", method="POST", data={})
    assert status == 400


def test_api_ask_null_question():
    status, body = http_request("/api/ask", method="POST", data={"question": None})
    assert status == 400


# =========================================================================
# 6. Additional endpoints: exceptions, settlements, forecast, controls, runs, benchmark
# =========================================================================
def test_api_additional_endpoints():
    endpoints = [
        ("/api/exceptions", 200, list),
        ("/api/settlements", 200, list),
        ("/api/forecast", 200, dict),
        ("/api/health/controls", 200, dict),
        ("/api/runs", 200, list),
        ("/api/benchmark", 200, dict),
        ("/api/razorpay/status", 200, dict),
    ]
    for path, exp_code, exp_type in endpoints:
        status, body = http_request(path)
        assert status == exp_code, f"{path} failed with {status}: {body}"
        assert isinstance(body, exp_type), f"{path} returned unexpected type: {type(body)}"
