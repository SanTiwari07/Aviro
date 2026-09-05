# Environment Variables Reference

All environment variables live in `.env` at the project root. Copy `.env.example` to `.env` and fill in the required values.

> **Zero Credential Exposure Invariant**: Never commit `.env` to version control. Server-side secrets (`RAZORPAY_KEY_SECRET`, `GEMINI_API_KEY`) must never be prefixed with `VITE_` or bundled into client code.

---

## Complete Reference

| Variable | Required | Runtime | Purpose | Default / Example |
|---|---|---|---|---|
| `GEMINI_API_KEY` | Optional (AI) | Server only | Authenticates to Google Gemini API | `AIzaSy...` |
| `GEMINI_MODEL` | No | Server only | Gemini model designation | `gemini-2.5-flash` |
| `RAZORPAY_KEY_ID` | Optional (Test Mode)| Server only | Razorpay Test-Mode Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Optional (Test Mode)| Server only | Razorpay Test-Mode Key Secret | `secret_...` |
| `RAZORPAY_WEBHOOK_SECRET` | No | Server only | Secret for HMAC SHA256 signature verification | `whsec_...` |
| `DATABASE_URL` | No | Server only | SQLAlchemy DB connection string | `sqlite:///./arivo.db` |
| `HIGH_VALUE_THRESHOLD_PAISE` | No | Server only | Minor unit threshold for mandatory review | `5000000` (₹50,000) |
| `PORT` | No | Server only | Backend HTTP port | `8000` |
| `APP_ENV` | No | Server only | Environment name | `development` |
| `LOG_LEVEL` | No | Server only | Python logging level | `INFO` |
| `VITE_API_URL` | No | Frontend | Base URL for production builds | `http://localhost:8000` |

---

## Fallback & Graceful Degradation Behavior

- If `GEMINI_API_KEY` is unset: The deterministic matching engine and Control Gate operate at 100% capacity (11,900+ rec/s). AI investigation falls back to deterministic rule-based rationales.
- If `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` is unset: The server operates normally using the controlled synthetic benchmark dataset. Diagnostic endpoints report `Not Configured`, preserving demo safety.
