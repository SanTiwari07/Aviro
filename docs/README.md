# Arivo — Documentation

> **Know where every rupee went — or know exactly why you don't.**

Arivo is an AI Finance Controller that automatically reconciles payments against settlements, routes ambiguous cases to Gemini for investigation, and enforces strict financial controls before any decision is finalised.

---

## Quick Start

```bash
# 1. Clone and enter the project
git clone <repository>
cd arivo

# 2. Copy environment file and add your Gemini API key
cp .env.example .env
# Edit .env: set GEMINI_API_KEY=AIza...

# 3. Install all dependencies
make install

# 4. Generate sample dataset
make generate-data

# 5. Start backend (Terminal 1, from project root)
.\venv\Scripts\python -m uvicorn backend.main:app --reload --port 8000

# 6. Start frontend (Terminal 2)
make dev-frontend

# 7. Open http://localhost:5173
# 8. Click "Run Now" on the Overview page to trigger reconciliation
```

---

## Architecture

```
User → React UI (Vite :5173)
         ↓ /api/* (Vite proxy)
       FastAPI backend (:8000)
         ↓
       Deterministic Engine  →  Control Gate  →  SQLite DB
         ↓ (ambiguous only)
       Gemini AI (google-genai)
```

No authentication. No external payment APIs. No webhooks.

---

## Documentation

| Document | Description |
|---|---|
| [Project Overview](./PROJECT_OVERVIEW.md) | What Arivo is, who it's for, what it does |
| [Architecture](./ARCHITECTURE.md) | System design, data flow, component map |
| [Setup](./SETUP.md) | Full installation and run instructions |
| [Environment](./ENVIRONMENT.md) | All environment variables reference |
| [API Overview](./API.md) | API conventions, request/response format |
| [API Endpoints](./API_ENDPOINTS.md) | Every endpoint with request/response examples |
| [Frontend](./FRONTEND.md) | React app structure, pages, components |
| [Backend](./BACKEND.md) | FastAPI structure, request lifecycle |
| [Database](./DATABASE.md) | SQLite schema, models, queries |
| [AI Integration](./AI.md) | Gemini integration, prompts, fallback |
| [Razorpay Status](./RAZORPAY.md) | Razorpay integration status and data compatibility |
| [Authentication](./AUTHENTICATION.md) | Current status and production roadmap |
| [Webhooks](./WEBHOOKS.md) | Ingestion architecture and production roadmap |
| [Error Handling](./ERROR_HANDLING.md) | Error strategy across all layers |
| [Testing](./TESTING.md) | Test suite, how to run, how to extend |
| [Debugging](./DEBUGGING.md) | Practical debug guide for common failures |
| [Troubleshooting](./TROUBLESHOOTING.md) | Symptom → cause → fix quick reference |
| [Security](./SECURITY.md) | Secret handling, data safety, CORS |
| [Development](./DEVELOPMENT.md) | How to extend the project |
| [Deployment](./DEPLOYMENT.md) | Build and deployment instructions |
| [Changelog](./CHANGELOG.md) | Change history |

---

## Common Troubleshooting

| Symptom | Fix |
|---|---|
| `No module named uvicorn` | Run `.\venv\Scripts\pip install -r backend\requirements.txt` from project root |
| `ModuleNotFoundError: No module named 'backend'` | Run uvicorn from project root: `.\venv\Scripts\python -m uvicorn backend.main:app ...` |
| Dashboard shows all zeros | Click **Run Now** on Overview to run reconciliation first |
| Ask Arivo returns error | Add real `GEMINI_API_KEY` to `.env` |
| `pydantic` build fails | Python 3.13 requires unpinned pydantic — requirements.txt now uses `>=` versions |

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for the full reference.
