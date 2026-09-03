# API Endpoints Reference

This reference is generated from the actual backend implementation in `backend/main.py`.

---

## 1. GET `/api/health`

### Purpose
Health check endpoint to verify that the FastAPI backend server is alive and responding.

### Authentication
None

### Request
No headers or body required.

```http
GET /api/health HTTP/1.1
Host: localhost:8000
```

### Response
```json
{
  "status": "ok",
  "service": "arivo"
}
```

### Errors
None anticipated under normal operation.

### Implementation
- Route: `backend/main.py:health_check`

### Example
```bash
curl -X GET http://localhost:8000/api/health
```

---

## 2. GET `/api/dashboard`

### Purpose
Retrieves aggregate operational statistics and financial totals across all processed reconciliation cases in SQLite.

### Authentication
None

### Request
```http
GET /api/dashboard HTTP/1.1
Host: localhost:8000
```

### Response
```json
{
  "processed": 4985,
  "matched": 4120,
  "review": 645,
  "exceptions": 220,
  "cash_position": {
    "expected": 249250000,
    "settled": 206000000,
    "unexplained": 43250000
  }
}
```
*Note: Monetary values in `cash_position` are stored in minor currency units (paise).*

### Errors
* `500 Internal Server Error`: Database query failure or SQLite read error.

### Implementation
- Route: `backend/main.py:get_dashboard`
- Database access: Queries `reconciliation_cases` table using SQLAlchemy aggregations (`func.sum`, `.count()`).

### Example
```bash
curl -X GET http://localhost:8000/api/dashboard
```

---

## 3. POST `/api/reconciliation/run`

### Purpose
Triggers an end-to-end reconciliation run over the payments and settlements dataset located in `dataset/data/`. Runs deterministic matching, calls Gemini AI on ambiguous cases, validates against Control Gate rules, and upserts cases to the database.

### Authentication
None

### Request
```http
POST /api/reconciliation/run HTTP/1.1
Host: localhost:8000
Content-Type: application/json
```

### Response
```json
{
  "status": "success",
  "cases_processed": 5000,
  "cases_saved": 5000
}
```

### Errors
* `400 Bad Request`: If `dataset/data/payments.csv` or `dataset/data/settlements.csv` does not exist.
  ```json
  {
    "detail": "Dataset not found. Run: make generate-data"
  }
  ```
* `500 Internal Server Error`: Parsing error or database commit error.

### Implementation
- Route: `backend/main.py:start_reconciliation`
- Engine: `backend/engine/reconciliation.py:run_reconciliation`
- AI Investigator: `backend/ai/gemini.py:investigate_case`
- Control Gate: `backend/engine/control_gate.py:validate_match`, `decide_final_status`

### Example
```bash
curl -X POST http://localhost:8000/api/reconciliation/run
```

---

## 4. GET `/api/reconciliation`

### Purpose
Retrieves a list of reconciliation cases ordered by most recent first, with optional pagination limit.

### Authentication
None

### Parameters
| Query Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `limit` | integer | No | 100 | Maximum number of cases to return |

### Request
```http
GET /api/reconciliation?limit=200 HTTP/1.1
Host: localhost:8000
```

### Response
```json
[
  {
    "id": 1,
    "case_id": "CASE_9D20A14B",
    "run_id": "RUN_E7412A90",
    "payment_id": "PAY_1001",
    "settlement_id": "SET_2004",
    "bank_txn_id": null,
    "status": "MATCHED",
    "match_method": "EXACT_ID",
    "ai_confidence": null,
    "ai_recommendation": null,
    "control_result": "PASS",
    "financial_impact": 50000,
    "created_at": "2026-09-02T16:45:00.000Z"
  }
]
```

### Errors
* `422 Unprocessable Entity`: If `limit` is not an integer.
* `500 Internal Server Error`: Database read error.

### Implementation
- Route: `backend/main.py:list_reconciliation`
- Model: `backend/database.py:ReconciliationCase`

### Example
```bash
curl -X GET "http://localhost:8000/api/reconciliation?limit=50"
```

---

## 5. POST `/api/ask`

### Purpose
Interactive AI copilot endpoint. Answers natural language queries regarding reconciliation policy, edge-case rationale, or financial controls using Gemini grounded on predefined controller policy.

### Authentication
None

### Request
```http
POST /api/ask HTTP/1.1
Host: localhost:8000
Content-Type: application/json

{
  "question": "Why are unexplained deltas routed to exception?"
}
```

### Response
```json
{
  "answer": "According to ARIVO policy, unexplained deltas represent potential financial discrepancies that cannot be automatically cleared. They must always be routed to EXCEPTION to ensure manual inspection by the finance team and prevent unverified financial write-offs."
}
```

### Errors
* `400 Bad Request`: If question is empty or whitespace only.
  ```json
  {
    "detail": "Question cannot be empty."
  }
  ```
* `422 Unprocessable Entity`: If request JSON is malformed or missing the `question` key.
* `500 Internal Server Error`: Upstream failure or missing Gemini credentials (returns safe error message in response body).

### Implementation
- Route: `backend/main.py:ask`
- AI client: `backend/ai/gemini.py:ask_arivo`

### Example
```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the threshold for high value transactions?"}'
```
