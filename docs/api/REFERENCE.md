# ARIVO API Reference

> **Base URL:** `http://localhost:8000` (FastAPI backend)  
> **Frontend Dev Proxy:** `http://localhost:5173/api/*`  
> **Interactive Docs:** `http://localhost:8000/docs` (Swagger UI) & `http://localhost:8000/redoc` (ReDoc)  
> **Specification Format:** OpenAPI 3.0 / FastAPI Automatic Swagger

This document serves as the authoritative REST API specification for ARIVO. All 20 endpoints implemented in `backend/main.py` are documented below with their exact HTTP methods, parameter types, request/response models, and status codes.

---

## Table of Contents

1. [System & Health](#1-system--health)
2. [Razorpay Integration & Sync](#2-razorpay-integration--sync)
3. [Reconciliation Operations](#3-reconciliation-operations)
4. [Executive Dashboard & Controls](#4-executive-dashboard--controls)
5. [Exceptions & Audit Export](#5-exceptions--audit-export)
6. [Settlements & Cash Forecasting](#6-settlements--cash-forecasting)
7. [AI Grounded Copilot & Policies](#7-ai-grounded-copilot--policies)
8. [Benchmark & Ablation](#8-benchmark--ablation)
9. [Webhooks](#9-webhooks)

---

## 1. System & Health

### `GET /api/health`
Liveness, database connectivity, and configuration check.

- **Request:** None
- **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "arivo",
  "version": "2.0.0",
  "database": "connected",
  "cases_indexed": 5114,
  "razorpay_configured": false
}
```

---

## 2. Razorpay Integration & Sync

### `GET /api/razorpay/status`
Returns configuration and credential status for Razorpay integration.

- **Response (200 OK):**
```json
{
  "configured": true,
  "mode": "test",
  "key_id_masked": "rzp_test_***",
  "live_ready": false
}
```

### `POST /api/razorpay/sync`
Triggers synchronization from Razorpay test mode API (`payments` and `settlements`).

- **Query Parameters:**
  - `force` *(optional, bool, default: false)*: Force re-sync even if recently synchronized.
- **Request Body (JSON, Optional):**
```json
{
  "mode": "incremental"
}
```
- **Response (200 OK):**
```json
{
  "sync_id": "SYNC_20260904_120000",
  "status": "SUCCESS",
  "source": "razorpay_test",
  "payments_fetched": 45,
  "settlements_fetched": 12,
  "records_normalized": 57,
  "records_rejected": 0,
  "pages_fetched": 2,
  "completed_at": "2026-09-04T12:00:05Z"
}
```

### `GET /api/sync/latest`
Returns metadata and status of the most recent synchronization operation.

- **Response (200 OK):** Latest `SyncRecord` object or `{"latest_sync": null}`.

---

## 3. Reconciliation Operations

### `POST /api/reconciliation/run`
Executes an idempotent reconciliation run across staged payments and settlement batches.

- **Query Parameters:**
  - `source` *(optional, string, default: "synthetic")*: Data source (`"synthetic"` or `"razorpay_test"`).
  - `force` *(optional, bool, default: false)*: Force re-run even if already reconciled.
- **Response (200 OK):**
```json
{
  "run_id": "RUN_614D3BAA",
  "status": "COMPLETED",
  "source": "synthetic",
  "records_processed": 5114,
  "matched_count": 3124,
  "review_count": 1849,
  "exception_count": 141,
  "total_financial_exposure_paise": 14284676500,
  "execution_time_seconds": 3.78,
  "throughput_rec_sec": 1352.6
}
```

### `GET /api/reconciliation` (Alias: `GET /api/cases`)
Retrieves a paginated list of reconciliation cases with status, source, and search filters.

- **Query Parameters:**
  - `status` *(optional, string)*: Filter by `MATCHED`, `REVIEW`, `EXCEPTION`.
  - `source` *(optional, string)*: Filter by `synthetic` or `razorpay_test`.
  - `search` *(optional, string)*: Substring match on `case_id`, `payment_id`, or `settlement_id`.
  - `limit` *(optional, int, default: 50)*: Items per page.
  - `offset` *(optional, int, default: 0)*: Pagination offset.
- **Response (200 OK):**
```json
{
  "total": 5114,
  "limit": 50,
  "offset": 0,
  "items": [
    {
      "case_id": "CASE_PAY_FLAGSHIP_001",
      "payment_id": "PAY_FLAGSHIP_001",
      "settlement_id": "SET_FLAGSHIP_001A",
      "status": "REVIEW",
      "match_method": "MULTIPLE",
      "financial_impact": 60000000,
      "amount_delta": 0,
      "ml_match_score": 0.97,
      "source": "synthetic",
      "created_at": "2026-09-04T12:00:00Z"
    }
  ]
}
```

### `GET /api/reconciliation/{case_id}`
Returns the complete evidentiary forensic chain for the Evidence Drawer.

- **Path Parameters:**
  - `case_id` *(string, required)*: Case identifier (e.g., `CASE_PAY_FLAGSHIP_001`).
- **Response (200 OK):**
```json
{
  "case": {
    "case_id": "CASE_PAY_FLAGSHIP_001",
    "run_id": "RUN_FLAGSHIP_DEMO",
    "status": "REVIEW",
    "match_method": "MULTIPLE",
    "financial_impact": 60000000,
    "amount_delta": 0,
    "ml_match_score": 0.97
  },
  "payment": {
    "payment_id": "PAY_FLAGSHIP_001",
    "amount": 60000000,
    "currency": "INR",
    "order_id": "ORD_FLAGSHIP_001",
    "method": "NetBanking",
    "fee": 120000,
    "tax": 21600,
    "created_at": "2026-09-04T10:00:00Z"
  },
  "settlement_waterfall": {
    "settlement_id": "SET_FLAGSHIP_001A",
    "gross_amount": 60000000,
    "fees": 120000,
    "tax": 21600,
    "net_amount": 59858400,
    "unexplained_delta": 0,
    "utr": "UTR_AXIS_FLAGSHIP_9918",
    "status": "PROCESSED"
  },
  "ai_investigation": {
    "used": true,
    "recommendation": "MATCHED",
    "confidence": 0.97,
    "summary": "AI Investigator evaluated payment metadata against candidate batches.",
    "supporting_evidence": ["Amount matches exactly (Rs. 6,00,000.00)"]
  },
  "control_gate": {
    "verdict": "BLOCK",
    "reasons": [
      "High-value transaction (Rs. 6,00,000 >= Rs. 50,000 threshold) with candidate ambiguity.",
      "Multiple candidate settlements found."
    ]
  }
}
```

### `POST /api/reconciliation/{case_id}/resolve`
Authoritative controller resolution endpoint. Allows authorized finance controllers to approve, reject, or escalate cases with audit metadata.

- **Path Parameters:**
  - `case_id` *(string, required)*
- **Request Body (JSON):**
```json
{
  "action": "APPROVED",
  "user": "Lead Controller",
  "notes": "Verified against Axis Bank MT940 statement manually."
}
```
- **Response (200 OK):**
```json
{
  "case_id": "CASE_PAY_FLAGSHIP_001",
  "status": "RESOLVED",
  "resolution_action": "APPROVED",
  "new_status": "MATCHED",
  "resolved_by": "Lead Controller",
  "resolved_at": "2026-09-04T18:00:00Z",
  "notes": "Verified against Axis Bank MT940 statement manually."
}
```

---

## 4. Executive Dashboard & Controls

### `GET /api/dashboard`
Returns executive-level financial metrics, volumes, and reconciliation rates.

- **Query Parameters:**
  - `source` *(optional, string)*: Filter by data source (`"synthetic"` or `"razorpay_test"`).
- **Response (200 OK):**
```json
{
  "processed_volume_paise": 24042940100,
  "confirmed_reconciled_paise": 9758263600,
  "under_controller_review_paise": 11655086500,
  "critical_exceptions_paise": 2629590000,
  "total_unresolved_exposure_paise": 14284676500,
  "matched_count": 3124,
  "review_count": 1849,
  "exception_count": 141,
  "total_count": 5114,
  "reconciliation_rate_pct": 61.09,
  "active_source": "synthetic"
}
```

### `GET /api/health/controls`
Returns the operational integrity status of the 7 core financial invariants.

- **Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "invariants_checked": 7,
  "invariants_passing": 7,
  "invariants": [
    {"name": "Zero Amount Delta", "code": "INV_ZERO_DELTA", "status": "PASS"},
    {"name": "Single Candidate", "code": "INV_SINGLE_CANDIDATE", "status": "PASS"},
    {"name": "High-Value Boundary", "code": "INV_HIGH_VALUE_THRESHOLD", "status": "PASS"},
    {"name": "No Conflicting Evidence", "code": "INV_NO_CONFLICTING_EVIDENCE", "status": "PASS"},
    {"name": "No Double Allocation", "code": "INV_NO_DOUBLE_ALLOCATION", "status": "PASS"},
    {"name": "Waterfall Integrity", "code": "INV_WATERFALL_INTEGRITY", "status": "PASS"},
    {"name": "Currency Uniformity", "code": "INV_CURRENCY_INR", "status": "PASS"}
  ]
}
```

### `GET /api/runs`
Returns historical reconciliation execution records with throughput and duration.

- **Query Parameters:**
  - `limit` *(optional, int, default: 20)*
  - `offset` *(optional, int, default: 0)*
- **Response (200 OK):** Array of `ReconciliationRun` records.

---

## 5. Exceptions & Audit Export

### `GET /api/exceptions`
Returns prioritized high-exposure exceptions sorted by descending financial impact.

- **Query Parameters:**
  - `limit` *(optional, int, default: 50)*
  - `offset` *(optional, int, default: 0)*
  - `source` *(optional, string)*: Filter by source.
  - `min_impact` *(optional, int)*: Minimum exposure filter in paise.
- **Response (200 OK):** Paginated exceptions list with reasons and amounts.

### `GET /api/exceptions/export`
Exports unresolved exceptions in RFC 4180 compliant CSV format for ERP ingestion.

- **Query Parameters:**
  - `source` *(optional, string)*
- **Response (200 OK):** `Content-Type: text/csv` download with headers: `case_id,payment_id,amount_paise,amount_inr,status,error_reason,created_at`.

---

## 6. Settlements & Cash Forecasting

### `GET /api/settlements`
Retrieves a paginated list of settlement batches and their waterfall breakdown.

- **Query Parameters:**
  - `limit` *(optional, int, default: 50)*
  - `offset` *(optional, int, default: 0)*
  - `source` *(optional, string)*
- **Response (200 OK):** Paginated settlement batch list.

### `GET /api/settlements/{settlement_id}`
Returns details for a specific settlement batch and associated payment references.

### `GET /api/forecast`
Returns a 7-day rolling cash flow forecast distinguishing confirmed cash from pending settlements.

- **Response (200 OK):**
```json
{
  "forecast_days": [
    {
      "date": "2026-09-05",
      "confirmed_cash_paise": 450000000,
      "expected_settlement_paise": 120000000,
      "unresolved_exposure_paise": 35000000
    }
  ]
}
```

---

## 7. AI Grounded Copilot & Policies

### `GET /api/policies`
Returns indexed RAG policy documents, sections, and chunk counts.

- **Response (200 OK):**
```json
{
  "policies_loaded": 6,
  "total_chunks": 42,
  "documents": [
    "arivo_control_policy.md",
    "reconciliation_policy.md",
    "fee_policy.md",
    "refund_policy.md",
    "settlement_policy.md",
    "chargeback_policy.md"
  ]
}
```

### `POST /api/ask`
Natural language financial controller copilot querying ledger records with grounded citations.

- **Request Body (JSON):**
```json
{
  "question": "Why was payment PAY_FLAGSHIP_001 held in review?"
}
```
- **Response (200 OK):**
```json
{
  "answer": "Payment PAY_FLAGSHIP_001 (₹6,00,000.00) was held in REVIEW because Invariant 2 detected multiple candidate settlements and Invariant 3 prohibited autonomous matching of amounts exceeding the ₹50,000 threshold.",
  "confidence": 0.95,
  "citations": [
    "CASE_PAY_FLAGSHIP_001: High-value transaction (Rs. 6,00,000 >= Rs. 50,000 threshold) with candidate ambiguity.",
    "Policy: arivo_control_policy.md § Section 3 (Control Gate Invariants)"
  ],
  "sources": ["database", "rag_policy"]
}
```

---

## 8. Benchmark & Ablation

### `GET /api/benchmark`
Executes or retrieves the empirical 4-tier benchmark ablation across 5,114 ground-truth records.

- **Query Parameters:**
  - `live_gemini` *(optional, bool, default: false)*: Run live Gemini API validation on sample cases.
  - `sample_size` *(optional, int, default: 10)*: Sample size for live Gemini calls.
- **Response (200 OK):**
```json
{
  "dataset_size": 5114,
  "throughput_records_per_second": 832.4,
  "execution_time_seconds": 6.14,
  "ablation_matrix": {
    "tier_1_naive": {"precision": 0.7506, "recall": 1.0000, "false_auto_matches": 1180},
    "tier_2_strict": {"precision": 0.7543, "recall": 0.9240, "false_auto_matches": 1022},
    "tier_3_arivo_core": {"precision": 1.0000, "recall": 0.9199, "false_auto_matches": 0},
    "tier_4_arivo_full": {"precision": 1.0000, "recall": 0.9199, "false_auto_matches": 0}
  },
  "flagship_safety_demo": {
    "record_id": "PAY_FLAGSHIP_001",
    "amount_inr": "Rs. 6,00,000.00",
    "gemini_recommendation": "MATCHED",
    "gemini_confidence": 0.97,
    "control_gate_verdict": "BLOCK",
    "final_arivo_decision": "REVIEW",
    "principle": "The AI is confident. The system is not."
  }
}
```

---

## 9. Webhooks

### `POST /api/webhooks/razorpay`
Asynchronous webhook listener for real-time payment gateway lifecycle events (`payment.captured`, `settlement.processed`).

- **Headers:** `X-Razorpay-Signature` (HMAC-SHA256)
- **Response (200 OK):** `{"status": "ok", "event": "payment.captured"}`
- **Security:** Validates signature using `RAZORPAY_WEBHOOK_SECRET` via `hmac.compare_digest()`.

