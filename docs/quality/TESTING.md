# Testing Strategy & Quality Assurance Guide

> **Total Tests:** 118 passing  
> **Test Framework:** Pytest 9.1.1  
> **Directory:** `backend/tests/`  
> **Execution Status:** 100% Pass (`118 passed in ~18s`)

ARIVO enforces rigorous automated testing covering mathematical invariants, matching logic, API contracts, AI boundaries, database constraints, and gateway webhooks.

---

## 1. Test Suite Directory Structure (15 Suites)

| Test Suite | Tests | Scope & Assertions |
|---|:---:|---|
| `test_adversarial.py` | 3 | High-value candidate collisions, gateway fee shifts, and weekend timestamp drift. |
| `test_ai_controller_boundaries.py` | 5 | Invariant enforcement: proves AI cannot move capital, mutate ledgers, or bypass Control Gate. |
| `test_api_endpoints.py` | 13 | FastAPI REST contract verification, response schemas, 404/400 validation, pagination. |
| `test_api_idempotency_and_boundaries.py` | 4 | Proves idempotent re-execution of reconciliation runs produces identical DB state. |
| `test_candidate_generator.py` | 4 | Temporal windowing ($T+0 \dots T+3$), currency filtering, and candidate pruning. |
| `test_control_gate.py` | 11 | Complete verification of all 7 invariants (`INV-001` through `INV-007`) under PASS and BLOCK conditions. |
| `test_currency_invariants.py` | 3 | Integer minor-unit paise calculations, non-INR currency rejection, floating-point guardrails. |
| `test_database.py` | 5 | Relational models, foreign key cascading, unique constraints, and dynamic SQLite migrations. |
| `test_full_qa_pipeline.py` | 23 | Comprehensive end-to-end integration and lifecycle testing from ingestion to resolution. |
| `test_gemini_investigator.py` | 5 | System prompt generation, JSON schema validation, timeout handling, and deterministic fallback. |
| `test_ml_model.py` | 7 | Feature engineering vectors, XGBoost inference scoring, and cold-start heuristic fallback. |
| `test_rag_pipeline.py` | 6 | Policy markdown chunking, TF-IDF / BM25 index retrieval, and prompt injection. |
| `test_razorpay_integration.py` | 11 | Gateway client pagination, exponential backoff, rate limiting, and normalizer. |
| `test_reconciliation_engine.py` | 12 | Matching strategy precedence (`EXACT_ID`, `AMOUNT_TIMESTAMP`, `ML_FALLBACK`, `MULTIPLE`, `UNMATCHED`). |
| `test_webhook_handler.py` | 6 | HMAC-SHA256 signature verification, tamper rejection, and event replay protection. |

---

## 2. Running Automated Tests

### Full Suite Run
```bash
# Using pytest directly
pytest backend/tests/ -v

# Or via Windows venv
.\venv\Scripts\pytest backend/tests/ -v

# Or using Makefile
make test
```

### Invariant & Boundary Tests Only
```bash
pytest backend/tests/test_control_gate.py backend/tests/test_ai_controller_boundaries.py -v
```

### Frontend Typechecking & Build
```bash
cd frontend
npm run typecheck
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
