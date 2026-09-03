# Practical Debugging Guide

This guide details step-by-step diagnostic workflows for identifying and resolving failures in Arivo.

---

## 1. Frontend Fails to Load or Shows White Screen

### Diagnostics:
1. Open Browser DevTools (F12) → Console.
2. Check for JavaScript runtime exceptions or missing imports.
3. Check Network tab for 404s on bundle assets.

### Common Root Causes:
- **Vite dev server is stopped**: Verify Terminal running `npm run dev` is active on port 5173.
- **Node modules missing**: Run `cd frontend && npm install`.
- **CSS build failure**: Ensure Tailwind and PostCSS configurations are intact.

---

## 2. API Calls Return 404 Not Found

### Diagnostics:
1. Check Network tab in DevTools for the exact request URL.
2. Look for accidental double prefixes: `http://localhost:5173/api/api/...`.
3. Verify the route exists in `backend/main.py`.

### Common Root Causes:
- **Vite Proxy misconfiguration**: In `frontend/vite.config.ts`, ensure `server.proxy` forwards `/api` to `http://localhost:8000`.
- **Backend not running**: Check that Uvicorn is active on port 8000.

---

## 3. Backend Fails to Start (`ModuleNotFoundError: No module named 'backend'`)

### Diagnostics:
Check the terminal where Uvicorn was launched.

### Root Cause:
Python cannot resolve `backend` if the command was executed from inside the `backend/` directory.

### Fix:
Launch Uvicorn strictly from the **project root**:
```powershell
cd d:\Projects\Arivo
.\venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
```

---

## 4. API Returns 500 Internal Server Error

### Diagnostics:
1. Inspect the terminal running Uvicorn.
2. Read the Python traceback printed in standard error.

### Common Root Causes:
- **Missing Dataset**: If `POST /api/reconciliation/run` fails, check if `dataset/data/payments.csv` exists. Run `make generate-data`.
- **Database Lock**: SQLite file `arivo.db` locked by another process. Close external SQLite viewers and restart.

---

## 5. Gemini AI Calls Fail / Return Fallback

### Diagnostics:
1. Check terminal output for log lines starting with `[Gemini]`.
2. Inspect `EvidenceDrawer` in UI: if AI section shows `AI_FAILURE` with 0% confidence, the fallback was triggered.

### Diagnostic Checklist:
1. **API Key presence**: Is `GEMINI_API_KEY` defined in `.env`?
2. **Placeholder value**: Does `.env` still contain `your_api_key_here`? Replace it with a valid Gemini API key from Google AI Studio.
3. **SDK Compatibility**: Ensure `google-genai` is installed (`.\venv\Scripts\pip show google-genai`).

---

## 6. Pip Install Fails on Pydantic / Wheel Building

### Diagnostics:
Pip outputs: `ERROR: Failed building wheel for pydantic-core` and mentions `maturin` or `Cargo.toml`.

### Root Cause:
Python 3.13 lacks pre-built wheels for older pinned versions of `pydantic-core` (like `2.16.3`).

### Fix:
Ensure `backend/requirements.txt` uses `>=` instead of exact pins (e.g. `pydantic>=2.6.3`). Run:
```powershell
.\venv\Scripts\pip install -r backend\requirements.txt
```
