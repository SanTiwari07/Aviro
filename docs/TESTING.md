# Testing Strategy & Reference

Arivo includes automated unit testing, dataset validation, and an evaluation benchmark suite.

---

## Test Suite Overview

| Test Type | Location | Tool | Purpose |
|---|---|---|---|
| Unit Tests | `backend/tests/test_reconciliation.py` | Pytest | Tests matching engine & Control Gate rules |
| Dataset Validation | `dataset/validate_dataset.py` | Python script | Validates CSV integrity, types, and references |
| Accuracy Benchmark | `evaluation/benchmark.py` | Python script | Measures reconciliation accuracy vs ground truth |
| Type Checking | `frontend/` | TypeScript (`tsc`) | Validates frontend types and props |
| Linting | `backend/` & `frontend/` | Ruff & ESLint | Enforces syntax and style conventions |

---

## 1. Running Unit Tests

Unit tests are located in `backend/tests/` and run via `pytest`.

```powershell
# From project root
.\venv\Scripts\pytest backend/tests

# Or using Makefile
make test
```

### Covered Test Cases:
1. `test_exact_match`: Verifies that identical payment and settlement references with matching amounts produce an `EXACT_ID` candidate, pass the Control Gate, and result in `MATCHED`.
2. `test_amount_mismatch`: Verifies that reference match with an amount difference generates `AMOUNT_MISMATCH`, is **BLOCKED** by the Control Gate, and results in `REVIEW`.
3. `test_control_gate_high_value_block`: Verifies that a transaction exceeding the high-value threshold is **BLOCKED** by the Control Gate even if AI recommends `MATCHED`.
4. `test_ai_matched_decision_pass`: Verifies that an ambiguous case with clean delta and AI recommendation `MATCHED` passes the Control Gate and results in `MATCHED`.
5. `test_ai_exception_decision`: Verifies that an unresolved anomaly flagged as `EXCEPTION` by AI results in `EXCEPTION`.

---

## 2. Dataset Validation

Validates that generated CSV files in `dataset/data/` meet format and relational consistency standards:

```powershell
# From project root
.\venv\Scripts\python dataset/validate_dataset.py

# Or using Makefile
make validate-data
```

---

## 3. Accuracy Benchmark

Measures system performance against known ground-truth cases (`dataset/ground_truth/ground_truth.csv`):

```powershell
# From project root
.\venv\Scripts\python evaluation/benchmark.py

# Or using Makefile
make benchmark
```

Output:
```text
ARIVO BENCHMARK RESULTS
=======================
Total Cases: 5000
Matched: 4120 (82.4%)
Review Required: 660 (13.2%)
Exceptions: 220 (4.4%)
False Matches: 0
```
*Note: A False Match count of 0 is a core acceptance metric for the Control Gate.*

---

## 4. Frontend Type Checking & Linting

```powershell
# In frontend directory
cd frontend
npm run typecheck    # TypeScript compiler check
npm run lint         # ESLint inspection
```
