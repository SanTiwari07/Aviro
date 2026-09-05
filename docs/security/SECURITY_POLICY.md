# Security Controls & Policy

Arivo is designed with defensive financial controls and strict data boundaries.

---

## Security Invariants

1. **Deterministic Authority**: AI recommendations never bypass financial validation rules.
2. **Absolute Threshold Caps**: Transactions equal to or exceeding ₹50,000.00 (5,000,000 paise) are governed by strict high-value invariants: any candidate ambiguity or missing exact identifier is automatically blocked from automated matching by the Control Gate and forced into manual controller review. (Authoritative canonical source: `backend/engine/control_gate.py` `HIGH_VALUE_THRESHOLD_PAISE = 5000000` and `knowledge/reconciliation_policy.md`).
3. **Secret Isolation**: External API keys (`GEMINI_API_KEY`) are kept exclusively server-side.
4. **No Code Execution**: The AI module has no access to shell tools, database query builders, or arbitrary code execution environments.

---

## Secret Management

| Secret | Permitted Locations | Prohibited Locations |
|---|---|---|
| `GEMINI_API_KEY` | Server-side `.env`, CI/CD secrets | Frontend code, Git commits, client-side JS bundles |
| `DATABASE_URL` | Server-side `.env` | Client-side bundles |

### Audit Rule:
Never commit `.env` or files containing secret keys. `.gitignore` explicitly excludes:
```text
.env
arivo.db
*.sqlite
```

---

## Financial Control Gate (`backend/engine/control_gate.py`)

The Control Gate serves as an automated firewall against incorrect financial reconciliations:

```python
def validate_match(candidate: Dict[str, Any]) -> Dict[str, Any]:
    reasons = []
    if candidate.get("amount_delta", 0) != 0:
        reasons.append("Non-zero amount delta.")
    if candidate.get("multiple_candidates", False):
        reasons.append("Multiple candidates.")
    if candidate.get("high_value", False):
        reasons.append("High-value transaction.")
    if candidate.get("conflicting_evidence", False):
        reasons.append("Conflicting evidence.")
    
    if len(reasons) > 0:
        return {"result": "BLOCK", "reasons": reasons}
    return {"result": "PASS", "reasons": []}
```

Even if Gemini returns `MATCHED` with 100% confidence, a `BLOCK` result from the Control Gate overrides it into a `REVIEW` status.

---

## CORS Policy

ARIVO restricts CORS origins based on the `ALLOWED_ORIGINS` environment variable, defaulting to trusted local frontend origins:
```python
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env.strip():
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
```
**For production:** Configure `ALLOWED_ORIGINS` in `.env` to match your production domain.

---

## Audit & Resolution Tracking

- **Case Resolution Tracking**: Manual controller resolutions (`POST /api/reconciliation/{case_id}/resolve`) record the controller identity (`resolved_by`), action (`resolution_action`), audit notes (`resolution_notes`), and timestamp (`resolved_at`) directly in the `reconciliation_cases` ledger.
- **Run Audit**: Every execution is recorded in the `reconciliation_runs` table with run duration, throughput, and outcome statistics.

---

## Known Security Limitations

- **No User Authentication**: Access to endpoints is unauthenticated in the current internal demonstration environment. Deploy behind a reverse proxy with SSO / OAuth2 for production.

