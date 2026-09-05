# Backend Architecture & Implementation

## 1. Technology Stack

- **Framework**: FastAPI (Python 3.11–3.13)
- **ASGI Server**: Uvicorn with reload support
- **Database & ORM**: SQLite 3 via SQLAlchemy 2.0 with dynamic schema migration
- **Data Manipulation**: Python standard libraries (`csv`, `json`, `uuid`, `os`, `urllib`) + `pandas`
- **Environment**: `python-dotenv`
- **AI SDK**: Google GenAI (`google-genai` / Gemini 2.5)
- **Port**: `8000`

---

## 2. Directory Structure

```
backend/
├── __init__.py                  # Package marker
├── main.py                      # Application entry point, 20 REST endpoints, lifecycle
├── database.py                  # SQLAlchemy engine, schema evolution, DB models
├── requirements.txt             # Compatible Python dependencies
├── ai/
│   ├── __init__.py
│   ├── gemini.py                # Gemini investigation + grounded Ask Arivo copilot
│   └── rag.py                   # In-memory policy chunking, retrieval, and synthesis
├── engine/
│   ├── __init__.py
│   ├── reconciliation.py        # Deterministic matching & duplicate prevention
│   ├── control_gate.py          # Authoritative Control Gate (7 financial invariants)
│   ├── cash_forecast.py         # 7-day cash forecast (Confirmed vs T+2 pipeline)
│   └── system_health.py         # Continuous integrity checks
├── integrations/
│   └── razorpay/
│       ├── __init__.py
│       ├── client.py            # Server-side HTTP Basic Auth client + pagination
│       ├── normalizer.py        # Integer paise & settlement waterfall validation
│       ├── sync.py              # Sync lifecycle & snapshot preservation
│       └── errors.py            # Structured exception hierarchy
├── ml/
│   ├── __init__.py
│   ├── features.py              # 8-dimensional candidate feature extraction
│   └── match_scorer.py          # XGBoost candidate scorer & heuristic fallback
└── tests/                       # 16 test suites (135 passing tests)
    ├── test_adversarial.py
    ├── test_api_idempotency_and_boundaries.py
    ├── test_benchmark_integrity.py
    ├── test_cash_forecast.py
    ├── test_dashboard_and_razorpay_flow.py
    ├── test_full_qa_pipeline.py
    ├── test_gemini_failure_modes.py
    ├── test_grouped_reconciliation.py
    ├── test_live_api_http.py
    ├── test_ml_ranking.py
    ├── test_normalizer.py
    ├── test_production_hardening.py
    ├── test_rag_and_resolution.py
    ├── test_razorpay_client.py
    ├── test_reconciliation.py
    └── test_reconciliation_paths.py
```

---

## 3. Key Services & Engines

### 1. Ingestion Layer (`backend/integrations/razorpay/`)
- **`RazorpayClient`**: Handles Basic Auth with `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Paginates endpoints (`payments`, `settlements`), enforces socket timeouts, and translates HTTP status codes into typed exceptions. Sanitizes credentials in `__repr__`.
- **`PaymentNormalizer` & `SettlementNormalizer`**: Strict schema gatekeepers. Converts amounts to integer paise, verifies INR currency, ISO 8601 timestamps, tags provenance (`source`, `source_record_id`, `sync_id`), and calculates the settlement waterfall:
  $$\text{Expected Net} = \text{Gross} - \text{Fees} - \text{Tax} - \text{Refunds} - \text{Chargebacks} + \text{Adjustments}$$
- **`RazorpaySyncService`**: Orchestrates `SYNC -> VALIDATION -> SNAPSHOT -> PERSISTENCE`. On network or provider error, gracefully catches exceptions and retains the **Last-Known-Good Snapshot**.

### 2. Matching Engine (`backend/engine/reconciliation.py`)
- High-throughput deterministic matching core (11,900+ rec/s).
- Enforces strict duplicate settlement allocation checks: once a settlement is assigned, it cannot be reused by subsequent payments.
- Identifies candidate matches: `EXACT_ID`, `AMOUNT_MISMATCH`, `AMOUNT_DATE`, `MULTIPLE`, `NO_MATCH`.

### 3. Authoritative Control Gate (`backend/engine/control_gate.py`)
- Independent guardian validating 7 financial invariants.
- Evaluates candidate matches before final state assignment.
- Absolute veto authority: if `Control Gate == BLOCK`, the final status is forced to `REVIEW` (or `EXCEPTION`), overriding any AI recommendation.

### 4. Cash Forecast Engine (`backend/engine/cash_forecast.py`)
- 100% deterministic 7-day cash projection.
- Distinguishes Confirmed Cash (in bank from `MATCHED` cases) from Expected Settlements (T+2 gateway pipeline) and Unresolved Financial Exposure.

### 5. Integrity Monitor (`backend/engine/system_health.py`)
- Evaluates population conservation, settlement waterfall balance, duplicate allocation, currency uniformity, high-value protection, unexplained delta containment, and AI schema validity.
