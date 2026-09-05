# Troubleshooting Reference

Symptom-to-solution reference for common issues encountered when setting up, running, or developing Arivo.

---

| Symptom | Likely Root Cause | How to Verify | Solution |
|---|---|---|---|
| `.\venv\Scripts\uvicorn: The term is not recognized` | Python packages were never installed into virtual environment | Check `venv/Scripts/` for `uvicorn.exe` | Run `.\venv\Scripts\pip install -r backend\requirements.txt` |
| `D:\...\python.exe: No module named uvicorn` | `uvicorn` package missing from virtual environment | Run `.\venv\Scripts\pip list` | Install dependencies: `.\venv\Scripts\pip install -r backend\requirements.txt` |
| `ModuleNotFoundError: No module named 'backend'` | Running Uvicorn from inside `backend/` directory or bad absolute imports | Check current working directory in terminal | Run from project root: `.\venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000` |
| `Failed building wheel for pydantic-core` during pip install | Pinned exact pydantic version lacks pre-built wheel for Python 3.13 | Pip logs mention `maturin` and Rust compiler errors | Use unpinned version in `backend/requirements.txt`: `pydantic>=2.6.3` |
| Dashboard counters remain `0` | No reconciliation run has been executed yet | Check SQLite database `reconciliation_cases` table count | Click **Run Now** on the Overview page or send `POST /api/reconciliation/run` |
| `Dataset not found. Run: make generate-data` (HTTP 400) | CSV files missing from `dataset/data/` | Check if `dataset/data/payments.csv` exists on disk | Run `make generate-data` or `.\venv\Scripts\python dataset/generate_dataset.py` |
| Ask Arivo returns `I encountered an error analyzing your request` | `GEMINI_API_KEY` missing, invalid, or quota exceeded | Check backend terminal logs for `[Gemini]` error messages | Set a valid `GEMINI_API_KEY` in `.env` and restart backend |
| AI Recommendation in Evidence Drawer shows `AI_FAILURE` (0% Confidence) | Gemini API request failed; system used safe fallback | Inspect case detail drawer in UI | Ensure network connectivity and valid `GEMINI_API_KEY` in `.env` |
| CORS errors in browser console | Frontend accessing backend directly on `:8000` without proxy | Check browser DevTools console | Ensure Vite proxy is enabled in `frontend/vite.config.ts` |
| High value transactions not automatically matching | Working as intended: Control Gate enforces safety invariant | Check Evidence Drawer; Control Gate reason: `High-value transaction with candidate ambiguity.` | High-value payments (≥₹50,000 / 5,000,000 paise) with ambiguity require manual human `REVIEW` by canonical policy design |
