# Security Controls & Policy

Arivo is designed with defensive financial controls and strict data boundaries.

---

## Security Invariants

1. **Deterministic Authority**: AI recommendations never bypass financial validation rules.
2. **Absolute Threshold Caps**: Transactions exceeding ₹5,000 (500,000 paise) are automatically blocked from automated matching and forced into manual review.
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

The development server enables permissive CORS:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
**For production:** Restrict `allow_origins` to trusted domain origins (e.g. `["https://arivo.internal.domain.com"]`).

---

## Known Security Limitations

- **No User Authentication**: Access to endpoints is unauthenticated. Deploy only inside private, secured intranets.
- **No Audit Log of Human Actions**: While AI actions are logged in SQLite, there is currently no table logging which human reviewed or approved a case.
