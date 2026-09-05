# Testing Strategy & Quality Assurance Guide

> **Total Tests:** 135 passing  
> **Test Framework:** Pytest 9.1.1  
> **Directory:** `backend/tests/`  
> **Execution Status:** 100% Pass (`135 passed in ~250s` full, fast suite in `~15s`)

ARIVO enforces rigorous automated testing covering mathematical invariants, matching logic, API contracts, AI boundaries, database constraints, and gateway webhooks.

---

## 1. Test Suite Directory Structure (16 Suites, 135 Tests)

| Test Suite | Tests | Scope & Assertions |
|---|:---:|---|
| `test_adversarial.py` | 3 | High-value candidate collisions, gateway fee shifts, and weekend timestamp drift. |
| `test_api_idempotency_and_boundaries.py` | 4 | Proves idempotent re-execution of reconciliation runs produces identical DB state. |
| `test_benchmark_integrity.py` | 1 | Mathematical validation of benchmark results and zero false auto-match guarantees. |
| `test_cash_forecast.py` | 7 | 7-day cash outlook based on Indian banking T+2 settlement lag models and invariant health. |
| `test_dashboard_and_razorpay_flow.py` | 5 | Dashboard metrics calculation, sync status, and end-to-end Razorpay ingestion pipeline. |
| `test_full_qa_pipeline.py` | 23 | Comprehensive end-to-end integration and lifecycle testing from ingestion to resolution. |
| `test_gemini_failure_modes.py` | 22 | Exhaustive verification of AI failure modes: network drops, rate limits, malformed JSON, and Control Gate vetoes. |
| `test_grouped_reconciliation.py` | 4 | Grouped settlement and multi-order refund waterfall reconciliation. |
| `test_live_api_http.py` | 13 | Live HTTP contract verification across all FastAPI REST endpoints. |
| `test_ml_ranking.py` | 6 | Feature extraction, XGBoost inference scoring, calibrated margins, and heuristic fallback. |
| `test_normalizer.py` | 5 | Integer paise conversion, ISO 8601 UTC timestamp normalization, and waterfall balance checks. |
| `test_production_hardening.py` | 13 | Boundary validation, non-INR currency rejection, floating-point guards, and DB concurrency. |
| `test_rag_and_resolution.py` | 5 | RAG policy chunking, retrieval, grounded entity extraction, and case resolution workflows. |
| `test_razorpay_client.py` | 6 | Gateway client authentication, pagination, socket timeouts, and error hierarchy. |
| `test_reconciliation.py` | 5 | Deterministic matching strategies, duplicate prevention, and Control Gate decisions. |
| `test_reconciliation_paths.py` | 7 | Edge-case path coverage for ambiguous candidates, fees, chargebacks, and partial refunds. |

---

## 2. Running Automated Tests

### Full Suite Run (135 Tests)
```bash
# Using pytest directly
pytest backend/tests/ -v

# Or via Windows venv
.\venv\Scripts\pytest backend/tests/ -v

# Or using Makefile
make test
```

### Fast Test Suite Run (Unit & Hardening Tests)
```bash
# Via Makefile
make test-fast
```

### Frontend Typechecking, Linting & Build
```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

---

## 3. Dataset Validation
Validates that generated CSV files in `dataset/` conform to relational integrity rules:
```bash
python dataset/validate_dataset.py
```
Asserts:
- Every payment references a valid order.
- Amounts are strictly positive integers in paise.
- Currency is strictly `INR`.
- Timestamps adhere to ISO 8601 UTC format.

