# Developer Guide

A guide for engineers extending or contributing to the Arivo codebase.

---

## Repository Layout

```
Arivo/
├── backend/                 # FastAPI backend service
│   ├── ai/                  # Gemini LLM prompts and API clients
│   ├── engine/              # Matching engine & Control Gate rules
│   ├── tests/               # Pytest unit tests
│   ├── database.py          # SQLAlchemy models and SQLite connection
│   └── main.py              # Route handlers and FastAPI application
├── frontend/                # React + Vite frontend application
│   ├── src/pages/           # Page views (Overview, Reconciliation, etc.)
│   ├── src/components/      # Reusable components (EvidenceDrawer)
│   └── src/api.ts           # Centralised fetch client
├── dataset/                 # Dataset generation & validation tools
├── evaluation/              # Accuracy benchmarks against ground truth
├── scripts/                 # Utility scripts (run_reconciliation.py)
├── docs/                    # System documentation
└── Makefile                 # Build and development commands
```

---

## Adding a New API Endpoint

1. Define the route in `backend/main.py`:
   ```python
   @app.get("/api/my-feature")
   def get_my_feature(db: Session = Depends(database.get_db)):
       return {"data": "example"}
   ```
2. Add type definition and endpoint call in `frontend/src/api.ts` or directly within the component using `apiFetch('/api/my-feature')`.
3. Update `docs/API_ENDPOINTS.md` with request, response, and error documentation.

---

## Adding a New Reconciliation Rule

Reconciliation logic is implemented in `backend/engine/reconciliation.py`.

To add a new matching strategy (e.g. Fuzzy Name Match):
1. In `run_reconciliation()`, implement candidate generation logic.
2. Assign a unique `match_method` string (e.g. `FUZZY_NAME`).
3. Set the ambiguity flags appropriately:
   ```python
   case["candidate"] = {
       "match_method": "FUZZY_NAME",
       "amount_delta": 0,
       "multiple_candidates": False,
       "high_value": p["amount"] > 5000000,
       "conflicting_evidence": True  # Flagged for AI review
   }
   ```
4. If this requires special validation in the Control Gate, update `backend/engine/control_gate.py:validate_match`.
5. Add a corresponding unit test in `backend/tests/test_reconciliation.py`.

---

## Adding a New UI Page

1. Create the page component in `frontend/src/pages/MyPage.tsx`.
2. Register the route and sidebar navigation link in `frontend/src/App.tsx`:
   ```tsx
   <Link to="/my-page" className="...">My Page</Link>
   // ...
   <Route path="/my-page" element={<MyPage />} />
   ```
3. Use Tailwind CSS utility classes and `frontend/src/api.ts` for backend requests.

---

## Code Style & Standards

- **Python**: Format and lint using Ruff:
  ```powershell
  make format
  make lint
  ```
- **TypeScript / React**: Check types with `tsc` and format with ESLint:
  ```powershell
  make typecheck
  ```
