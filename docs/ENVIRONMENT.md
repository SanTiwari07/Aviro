# Environment Variables

All environment variables live in `.env` at the project root.  
Copy `.env.example` to `.env` and fill in the required values.

> **Never commit `.env` to version control.** It is listed in `.gitignore`.

---

## Complete Reference

| Variable | Required | Runtime | Purpose | Example |
|---|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** (for AI) | Server only | Authenticates to Google Gemini API | `AIzaSy...` |
| `GEMINI_MODEL` | No | Server only | Gemini model name to use | `gemini-2.5-flash` |
| `APP_ENV` | No | Server only | Environment label for logging | `development` |
| `LOG_LEVEL` | No | Server only | Python logging level | `INFO` |
| `BACKEND_PORT` | No | Server only | Port hint for documentation; uvicorn uses `--port` flag directly | `8000` |
| `DATABASE_URL` | No | Server only | SQLAlchemy DB connection string; if unset, uses absolute path to `arivo.db` | `sqlite:////abs/path/arivo.db` |
| `FRONTEND_PORT` | No | Frontend only | Port hint; Vite uses its own config | `5173` |
| `VITE_API_URL` | No | Frontend (build) | API base URL for production builds; leave empty in dev (Vite proxy handles it) | `https://api.example.com` |

---

## Server-Only Variables (Never Expose to Browser)

These variables must **never** be prefixed with `VITE_` or otherwise bundled into the frontend:

| Variable | Why it must stay server-side |
|---|---|
| `GEMINI_API_KEY` | Exposing it allows anyone to use your Gemini quota |
| `DATABASE_URL` | Contains DB credentials/path |

---

## Frontend Variables

Only variables prefixed with `VITE_` are available in the browser bundle.

| Variable | Available in browser | Notes |
|---|---|---|
| `VITE_API_URL` | Yes | In dev, the Vite proxy handles API routing so this is unused. In production, set to your backend URL. |

---

## Default Values

| Variable | Default if unset |
|---|---|
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `LOG_LEVEL` | `INFO` |
| `DATABASE_URL` | Absolute path to `arivo.db` at project root (computed by `database.py`) |

---

## Environment-Specific Notes

### Development
Use `.env` with a real `GEMINI_API_KEY`. The Vite proxy forwards `/api/*` to `http://localhost:8000` so `VITE_API_URL` is not needed.

### Production
Set `VITE_API_URL` to your deployed backend URL **at build time**:
```bash
VITE_API_URL=https://api.yourdomain.com npm run build
```
Set `DATABASE_URL` to an absolute path or a real database URL in your server environment.

---

## Validation

The backend loads `.env` via `python-dotenv` at startup (in `backend/main.py`). If `GEMINI_API_KEY` is absent or is the placeholder `your_api_key_here`, AI calls will fail gracefully with fallback responses — the reconciliation engine itself still runs.

There is no startup crash for a missing key; the error is surfaced per-request when Gemini is invoked.
