# ARIVO - Complete API Endpoints Reference

All endpoints are hosted by FastAPI at `http://localhost:8000` and proxied through Vite at `http://localhost:5173/api/*`.

---

## 1. System & Ingestion Endpoints

### `GET /api/health`
- **Purpose**: Liveness probe for backend server.
- **Response**: `{"status": "ok", "service": "arivo"}`

### `GET /api/razorpay/status`
- **Purpose**: Diagnostics on Razorpay test-mode API configuration, credential presence, and live connection test.
- **Response**:
```json
{
  "is_configured": true,
  "key_id_preview": "rzp_test_mock...",
  "connection": {
    "status": "AUTHENTICATED",
    "latency_ms": 142
  },
  "last_successful_snapshot": {
    "sync_id": "SYNC_20260903_120000",
    "completed_at": "2026-09-03T12:00:00Z",
    "payments_count": 50,
    "settlements_count": 50
  }
}
```

### `POST /api/razorpay/sync`
- **Purpose**: Triggers real-time ingestion from Razorpay API. Executes `SYNC -> VALIDATION -> SNAPSHOT -> PERSISTENCE`.
- **Response**:
```json
{
  "status": "SUCCESS",
  "sync_id": "SYNC_20260903_120100",
  "payments_fetched": 50,
  "settlements_fetched": 50,
  "completed_at": "2026-09-03T12:01:05Z"
}
```

### `GET /api/sync/latest`
- **Purpose**: Returns the most recent sync metadata and record counts.
- **Response**: Latest `SyncRecord` JSON.

### `POST /api/webhooks/razorpay`
- **Purpose**: Webhook listener for incoming Razorpay lifecycle events. Verifies `X-Razorpay-Signature` HMAC.
- **Response**: `{"status": "received"}`

---

## 2. Core Reconciliation Endpoints

### `POST /api/reconciliation/run`
- **Purpose**: Executes reconciliation cycle across payments and settlements for the specified source.
- **Request Body** (optional): `{"source": "synthetic"}` or `{"source": "razorpay_test"}`
- **Response**:
```json
{
  "run_id": "RUN_9A2F8B1C",
  "source": "synthetic",
  "cases_processed": 5114,
  "cases_saved": 5114,
  "matched": 3500,
  "review": 1280,
  "exceptions": 334,
  "duration_ms": 427,
  "throughput": 11960.7
}
```

### `GET /api/dashboard`
- **Purpose**: Dashboard summary metrics including hero **Unresolved Financial Exposure** breakdown.
- **Query Params**: `?source=synthetic` or `?source=razorpay_test`
- **Response**:
```json
{
  "processed": 5114,
  "matched": 3500,
  "review": 1280,
  "exceptions": 334,
  "unresolved_exposure": {
    "total_paise": 41642666,
    "review_paise": 24500000,
    "exception_paise": 17142666,
    "high_value_paise": 12500000
  },
  "cash_position": {
    "expected": 150000000,
    "settled": 108357334,
    "unexplained": 120000
  }
}
```

### `GET /api/reconciliation`
- **Purpose**: Paginated ledger of reconciliation records with multi-filter and search capability.
- **Query Params**: `?source=all&status=all&search=PAY_123&limit=100&offset=0`
- **Response**: Array of `ReconciliationCase` items with provenance, control results, and AI summaries.

### `GET /api/reconciliation/{case_id}`
- **Purpose**: Detailed case view including raw payment details, linked settlement waterfall, AI audit reasoning, and Control Gate checks.
- **Response**: Full case evidentiary object.

---

## 3. Exceptions & Settlement Batches

### `GET /api/exceptions`
- **Purpose**: Returns ranked exception ledger ordered by highest financial exposure (`financial_impact DESC`).
- **Query Params**: `?source=synthetic`
- **Response**: Array of exception and review cases.

### `GET /api/exceptions/export`
- **Purpose**: Generates and downloads a clean RFC 4180 CSV export of all unresolved exceptions.
- **Response Header**: `Content-Disposition: attachment; filename=arivo_exceptions_export.csv`

### `GET /api/settlements`
- **Purpose**: Lists settlement batches with computed waterfall columns (`gross`, `fees`, `tax`, `net`, `unexplained_delta`).
- **Response**: Array of settlement batch records.

### `GET /api/settlements/{settlement_id}`
- **Purpose**: Detailed single settlement batch view with associated reconciliation records.
- **Response**: Settlement batch record + linked transactions.

---

## 4. Financial Intelligence, Health & Copilot

### `GET /api/forecast`
- **Purpose**: Deterministic 7-day cash forecast distinguishing Confirmed Cash (in bank) from Expected Settlements (T+2 pipeline).
- **Response**:
```json
{
  "confirmed_cash": 108357334,
  "expected_settlements": 41642666,
  "days": [
    {
      "day_offset": 0,
      "date": "2026-09-03",
      "label": "Today",
      "confirmed_cash_paise": 108357334,
      "expected_settlement_paise": 0,
      "confidence": "CERTAIN"
    }
  ],
  "methodology": "Deterministic T+2 settlement lag modeling using captured payments and staged batches."
}
```

### `GET /api/health/controls`
- **Purpose**: Continuous integrity monitor validating 7 financial invariants (conservation, waterfall arithmetic, duplicate allocation, currency consistency, high-value protection, unexplained delta, and AI schema).
- **Response**:
```json
{
  "overall_status": "HEALTHY",
  "passed_checks": 7,
  "total_checks": 7,
  "checks": [
    {"name": "Population Conservation", "passed": true, "details": "All captured payments accounted for"},
    {"name": "Settlement Waterfall Balance", "passed": true, "details": "Gross - Fees - Tax = Net verified"}
  ]
}
```

### `GET /api/runs`
- **Purpose**: Historical audit log of reconciliation runs with duration, throughput, and AI stats.
- **Response**: Array of `ReconciliationRun` records.

### `GET /api/benchmark`
- **Purpose**: Returns benchmark comparison (Baseline vs ARIVO) and Flagship AI Safety Demo payload.
- **Response**:
```json
{
  "throughput": 11960.7,
  "baseline": {"precision": 72.86, "recall": 100.0, "false_matches": 1323},
  "arivo": {"precision": 70.83, "recall": 91.52, "false_matches": 0},
  "flagship_demo": {
    "record_id": "PAY_FLAGSHIP_001",
    "amount_paise": 60000000,
    "gemini_confidence": 0.97,
    "gemini_recommendation": "MATCHED",
    "control_gate_verdict": "BLOCK",
    "final_status": "REVIEW",
    "safety_takeaway": "The AI is confident. The system is not."
  }
}
```

### `POST /api/ask`
- **Purpose**: Grounded AI Copilot. Queries SQLite ledger and passes verified facts to Gemini.
- **Request Body**: `{"question": "How much money is currently unresolved?"}`
- **Response**:
```json
{
  "answer": "Current unresolved financial exposure is ₹41,64,266.00 across 1,614 transactions...",
  "referenced_records": [
    {"id": "PAY_FLAGSHIP_001", "type": "payment", "status": "REVIEW"}
  ]
}
```
