# Setup Guide

## Requirements

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.11–3.13 | 3.13 confirmed working |
| pip | ≥ 25 | Ships with Python |
| Node.js | ≥ 18 | For the React frontend |
| npm | ≥ 9 | Ships with Node.js |
| Git | Any | For cloning |

No Docker, no external database server, no Redis — SQLite is used and created automatically.

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd arivo
```

---

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and set your Gemini API key:

```env
GEMINI_API_KEY=AIzaSy...your_real_key_here
```

See [ENVIRONMENT.md](./ENVIRONMENT.md) for all variables.

> **Note:** The application runs without a Gemini key, but AI investigation and Ask Arivo will return fallback/error responses.

---

## 3. Install All Dependencies

```bash
make install
```

This runs:
- `python -m venv venv` — creates a Python virtual environment
- `.\venv\Scripts\pip install -r backend\requirements.txt` — installs Python packages
- `cd frontend && npm install` — installs Node packages

**Manual equivalent (Windows PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\pip install -r backend\requirements.txt
cd frontend
npm install
cd ..
```

---

## 4. Generate Sample Dataset

```bash
make generate-data
```

This creates `dataset/data/payments.csv` and `dataset/data/settlements.csv` with 5,000 synthetic records.

**Manual equivalent:**
```powershell
.\venv\Scripts\python dataset/generate_dataset.py --rows 5000 --seed 20260902
```

---

## 5. Start the Development Servers

You need **two terminals** open simultaneously.

### Terminal 1 — Backend

From the **project root** (`d:\Projects\Arivo`):

```powershell
.\venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000
```

> ⚠️ **Must run from project root.** Running from inside `backend/` causes `ModuleNotFoundError`.

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2 — Frontend

```powershell
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x  ready in ...ms
  ➜  Local:   http://localhost:5173/
```

---

## 6. Open the Application

Navigate to: **http://localhost:5173**

Click **Run Now** on the Overview page to trigger your first reconciliation run.

---

## 7. Available Make Commands

| Command | What it does |
|---|---|
| `make install` | Install all dependencies |
| `make dev-backend` | Start backend (from project root) |
| `make dev-frontend` | Start frontend |
| `make generate-data` | Generate synthetic dataset |
| `make validate-data` | Validate dataset integrity |
| `make reconcile` | Trigger reconciliation via HTTP script |
| `make benchmark` | Run accuracy benchmark against ground truth |
| `make test` | Run Python unit tests |
| `make lint` | Lint backend + frontend |
| `make format` | Format backend + frontend |
| `make typecheck` | TypeScript type check |
| `make clean` | Remove generated data, build artifacts, pycache |

---

## 8. Production Build

```bash
cd frontend && npm run build
```

Output goes to `frontend/dist/`. Serve with any static file server.

The backend has no separate build step — serve with a production ASGI server:

```bash
.\venv\Scripts\python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## Common Setup Problems

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for a full reference. Quick answers:

| Problem | Fix |
|---|---|
| `No module named uvicorn` | Run pip install from project root first |
| `pydantic build fails` | Use Python 3.11+ and the current `requirements.txt` (uses `>=` not exact pins) |
| `ModuleNotFoundError: backend` | Run uvicorn from project root, not from inside `backend/` |
| Port 8000 already in use | Change `--port 8001` and update `VITE_API_URL` in `.env` |
