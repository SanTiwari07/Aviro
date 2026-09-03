# Changelog

All notable changes and bug fixes made to the Arivo codebase.

---

## [Current Audit & Fix Release] - 2026-09-02

### Fixed
- **Python 3.13 Wheel Build Failures**: Removed strict version pinning (`pydantic==2.6.3`, `fastapi==0.110.0`, `uvicorn==0.27.1`) in `backend/requirements.txt` that failed to compile on Python 3.13 due to lack of pre-built Rust/maturin wheels. Replaced with compatible `>=` constraints.
- **Deprecated Gemini SDK**: Replaced end-of-life `google-generativeai==0.4.1` package with the modern official `google-genai` SDK in `backend/requirements.txt` and `backend/ai/gemini.py`.
- **Control Gate Bug**: Fixed critical string mismatch in `backend/engine/control_gate.py` where the function checked for `"MATCH"` instead of `"MATCHED"`, causing AI recommendations to be silently ignored.
- **Database URL Path Conflict**: Removed relative `DATABASE_URL=sqlite:///./arivo.db` from `.env` that conflicted with absolute path resolution in `backend/database.py`.
- **Absolute Module Imports**: Changed absolute `from backend import ...` imports in `backend/main.py` and `evaluation/benchmark.py` to relative/sys.path imports, preventing `ModuleNotFoundError` when starting the server from different directories.
- **Double Evidence Nesting**: Cleaned up evidence payload passed to `investigate_case` in `backend/main.py` to provide flat, unpolluted data to the Gemini prompt.
- **Hardcoded Frontend URLs**: Replaced hardcoded `http://localhost:8000` URLs across all React pages with a centralized `apiFetch` wrapper in `frontend/src/api.ts` and configured a Vite reverse proxy in `frontend/vite.config.ts`.
- **Mock Cash Position**: Replaced hardcoded dummy figures in `frontend/src/pages/Overview.tsx` with live database aggregation calculations in `/api/dashboard`.
- **Interactive UI Trigger**: Added a "Run Reconciliation" button on the Overview page so users can initiate a run directly from the browser without CLI scripts.

### Documentation
- Created complete documentation suite under `/docs`:
  - `docs/README.md`
  - `docs/PROJECT_OVERVIEW.md`
  - `docs/ARCHITECTURE.md`
  - `docs/SETUP.md`
  - `docs/ENVIRONMENT.md`
  - `docs/API.md`
  - `docs/API_ENDPOINTS.md`
  - `docs/DATABASE.md`
  - `docs/AI.md`
  - `docs/RAZORPAY.md`
  - `docs/FRONTEND.md`
  - `docs/BACKEND.md`
  - `docs/AUTHENTICATION.md`
  - `docs/WEBHOOKS.md`
  - `docs/ERROR_HANDLING.md`
  - `docs/TESTING.md`
  - `docs/DEBUGGING.md`
  - `docs/DEPLOYMENT.md`
  - `docs/SECURITY.md`
  - `docs/TROUBLESHOOTING.md`
  - `docs/DEVELOPMENT.md`
  - `docs/CHANGELOG.md`

### Testing
- Added comprehensive unit tests in `backend/tests/test_reconciliation.py` covering exact match, amount mismatch, control gate blocking high-value transactions, AI MATCHED pass path, and AI EXCEPTION path.
