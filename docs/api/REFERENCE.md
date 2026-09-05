# ARIVO API Reference

> **Base URL:** `http://localhost:8000` (FastAPI backend)  
> **Frontend Dev Proxy:** `http://localhost:5173/api/*`  
> **Specification Format:** OpenAPI 3.0 / FastAPI Automatic Swagger at `/docs`

This document serves as the authoritative REST API specification for ARIVO. All 20 endpoints implemented in `backend/main.py` are documented below with their exact HTTP methods, parameter types, request/response models, and status codes.

---

## Table of Contents

1. [System & Health](#1-system--health)
2. [Reconciliation Operations](#2-reconciliation-operations)
3. [Financial Control Center](#3-financial-control-center)
4. [AI Investigation & Copilot](#4-ai-investigation--copilot)
5. [Controlled Benchmark](#5-controlled-benchmark)
6. [Razorpay Payment Gateway Integration](#6-razorpay-payment-gateway-integration)
7. [System Administration](#7-system-administration)

---

## 1. System & Health

### `GET /api/health`
Liveness, database readiness, and gateway configuration check.

- **Request:** None
- **Response (200 OK):**
```json
{
  "status": "ok",
  "service": "arivo",
  "version": "2.0.0",
  "database": "connected",
  "cases_indexed": 30688,
  "razorpay_configured": true
}
```

---

## 2. Reconciliation Operations

### `POST /api/reconcile`
Executes an idempotent reconciliation run across staged payments and settlement batches.

- **Request Body (JSON, Optional):**
```json
{
  "source": "synthetic", // or "razorpay"
  "limit": 1000
}
```
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
  "execution_time_seconds": 3.78
}
```

### `GET /api/reconciliation/cases`
Retrieves a paginated list of reconciliation cases with optional status and text filters.

- **Query Parameters:**
  - `status` *(optional, string)*: Filter by `MATCHED`, `REVIEW`, `EXCEPTION`.
  - `source` *(optional, string)*: Filter by `synthetic` or `razorpay`.
  - `search` *(optional, string)*: Substring match on `case_id`, `payment_id`, or `order_id`.
  - `page` *(optional, int, default: 1)*: Page number.
  - `page_size` *(optional, int, default: 50)*: Items per page.
- **Response (200 OK):**
```json
{
  "items": [
    {
      "case_id": "CASE_PAY_4A269938",
      "payment_id": "PAY_4A269938",
      "status": "REVIEW",
      "match_method": "MULTIPLE",
      "financial_impact": 60000000,
      "amount_delta": 0,
      "ml_match_score": 0.94,
      "source": "synthetic",
      "created_at": "2026-09-04T12:00:00Z"
    }
  ],
  "total": 30688,
  "page": 1,
  "page_size": 50,
  "total_pages": 614
}
```

### `GET /api/reconciliation/{case_id}`
Returns the complete evidentiary forensic chain for the Evidence Drawer.

- **Path Parameters:**
  - `case_id` *(string, required)*: The unique case identifier (e.g., `CASE_PAY_FLAGSHIP_001`).
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
    "summary": "AI Investigator evaluated payment metadata...",
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
- **Error (404 Not Found):** `{"detail": "Reconciliation case not found"}`

### `POST /api/reconciliation/{case_id}/resolve`
Authoritative controller resolution endpoint. Allows authorized finance controllers to override or confirm case outcomes.

- **Path Parameters:**
  - `case_id` *(string, required)*
- **Request Body (JSON):**
```json
{
  "action": "APPROVED", // "APPROVED", "REJECTED", or "ESCALATED"
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

## 3. Financial Control Center

### `GET /api/control-center/summary`
Returns executive-level financial metrics, including processed volume, reconciled volume, and exposure under review.

- **Response (200 OK):**
```json
{
  "processed_volume_paise": 24042940100,
  "confirmed_reconciled_paise": 9758263600,
  "under_controller_review_paise": 11655086500,
  "critical_exceptions_paise": 2629590000,
  "total_unresolved_exposure_paise": 14284676500,
  "high_value_items_count": 5642,
  "reconciliation_rate_pct": 40.59
}
```

### `GET /api/control-center/recent-runs`
Returns historical execution runs.

- **Response (200 OK):** Array of recent run records with timings, match rates, and status.

### `GET /api/control-center/exceptions`
Returns prioritized high-exposure exceptions sorted by descending monetary impact.

- **Query Parameters:**
  - `limit` *(optional, int, default: 20)*
- **Response (200 OK):** Array of exception cases with gross amount, error codes, and control gate reasons.

### `GET /api/control-center/exceptions/export`
Exports unresolved exceptions in RFC 4180 compliant CSV format for ERP ingestion.

- **Response (200 OK):** `Content-Type: text/csv` download with headers: `case_id,payment_id,amount_paise,amount_inr,status,error_reason,created_at`.

### `GET /api/control-center/forecast`
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

### `GET /api/control-center/audit-trail`
Chronological immutable audit log of all system and user actions.

- **Query Parameters:**
  - `limit` *(optional, int, default: 100)*
- **Response (200 OK):** Array of audit events.

---

## 4. AI Investigation & Copilot

### `POST /api/investigate`
Triggers an on-demand Gemini 2.5 Flash semantic investigation for a specific payment ID.

- **Request Body (JSON):**
```json
{
  "payment_id": "PAY_4A269938"
}
```
- **Response (200 OK):**
```json
{
  "payment_id": "PAY_4A269938",
  "ai_recommendation": "MATCHED",
  "ai_confidence": 0.94,
  "summary": "Candidate SET_4A269938 matched based on timestamp and order reference.",
  "control_gate_verdict": "BLOCK",
  "control_gate_reasons": ["Multiple candidate settlements found in T+2 window."],
  "final_status": "REVIEW"
}
```

### `POST /api/ask`
Natural language financial controller copilot querying ledger records with grounded citations.

- **Request Body (JSON):**
```json
{
  "query": "Why was payment PAY_FLAGSHIP_001 held in review?"
}
```
- **Response (200 OK):**
```json
{
  "query": "Why was payment PAY_FLAGSHIP_001 held in review?",
  "answer": "Payment PAY_FLAGSHIP_001 (₹6,00,000.00) was held in REVIEW because Invariant 2 detected multiple candidate settlements (SET_FLAGSHIP_001A and SET_FLAGSHIP_001B) and Invariant 3 prohibited autonomous matching of amounts exceeding the ₹50,000 threshold.",
  "citations": [
    {"source": "CASE_PAY_FLAGSHIP_001", "type": "reconciliation_case"},
    {"source": "INV-002", "type": "control_policy"},
    {"source": "INV-003", "type": "control_policy"}
  ]
}
```

---

## 5. Controlled Benchmark

### `GET /api/benchmark`
Executes the empirical 3-tier benchmark across 5,114 ground-truth records.

- **Response (200 OK):**
```json
{
  "dataset_size": 5114,
  "throughput_records_per_second": 1352.6,
  "execution_time_seconds": 3.78,
  "metrics": {
    "baseline": {
      "matched_cases": 4732,
      "false_auto_matches": 1180,
      "precision": 0.7506,
      "recall": 1.0000,
      "f1_score": 0.8575,
      "false_match_exposure_paise": 1155702300
    },
    "arivo_full": {
      "matched_cases": 3124,
      "false_auto_matches": 0,
      "precision": 1.0000,
      "recall": 0.9199,
      "f1_score": 0.9583,
      "false_match_exposure_paise": 0
    }
  },
  "ai_value_and_safety": {
    "ambiguous_investigated": 1849,
    "unsafe_ai_matches_blocked": 1071,
    "financial_exposure_prevented_paise": 1155702300,
    "false_matches_eliminated": 1180
  },
  "flagship_safety_demo": {
    "record_id": "PAY_FLAGSHIP_001",
    "amount_inr": "Rs. 6,00,000.00",
    "gemini_recommendation": "MATCHED",
    "gemini_confidence": 0.97,
    "control_gate_action": "BLOCK",
    "final_arivo_decision": "REVIEW",
    "principle": "The AI is confident. The system is not."
  }
}
```

---

## 6. Razorpay Payment Gateway Integration

### `GET /api/razorpay/sync/status`
Returns synchronization status, connection health, and last-known-good snapshot metadata.

### `POST /api/razorpay/sync`
Performs an incremental pull of payments and settlements from Razorpay.

### `POST /api/razorpay/sync/backfill`
Pulls historical records for a specified date range.

- **Request Body (JSON):**
```json
{
  "from_date": "2026-08-01T00:00:00Z",
  "to_date": "2026-08-31T23:59:59Z"
}
```

### `GET /api/razorpay/settlement-recon`
Gateway-specific settlement batch reconciliation report.

### `POST /api/razorpay/webhook`
Receives live asynchronous webhook notifications from Razorpay (`payment.captured`, `settlement.processed`).

- **Headers:** `X-Razorpay-Signature` (HMAC-SHA256)
- **Response (200 OK):** `{"status": "processed", "event_id": "evt_..."}`

---

## 7. System Administration

### `POST /api/reset-demo`
Restores the database to its pristine ground-truth demonstration state. Used for hackathon judging walkthroughs.

- **Response (200 OK):** `{"status": "reset_complete", "records_indexed": 5114}`
