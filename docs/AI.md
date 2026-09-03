# AI Integration (Gemini)

Arivo integrates Google Gemini to investigate ambiguous financial anomalies and act as an interactive finance copilot.

---

## SDK and Provider

- **SDK**: `google-genai` (modern official Google GenAI SDK)
- **Model**: Configurable via `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- **Location**: `backend/ai/gemini.py`
- **Authentication**: `GEMINI_API_KEY` from environment

---

## Architectural Role: AI vs. Deterministic

```
[Candidate Generated]
       ↓
Is case ambiguous? (conflicting_evidence OR multiple_candidates)
   ├── NO  → Skip AI (0 token cost, instant execution)
   └── YES → Invoke Gemini Investigator
                  ↓
       [Gemini returns recommendation & confidence]
                  ↓
       [Control Gate validates financial invariants]
                  ↓
       [Authoritative Final Decision]
```

Gemini **never** has direct write access to the database, cannot alter transaction records, and cannot override Control Gate invariants.

---

## 1. Case Investigation (`investigate_case`)

### When is it invoked?
When the deterministic engine encounters:
- `conflicting_evidence == True`: e.g. amount deltas, missing exact reference IDs.
- `multiple_candidates == True`: multiple settlement records match the same payment amount.

### Prompt & Structured Output
Gemini is instructed to return structured JSON using `types.GenerateContentConfig(response_mime_type="application/json")`.

**Input Evidence Payload:**
```json
{
  "payment_id": "PAY_1204",
  "settlement_id": "SET_9410",
  "amount": 25000,
  "match_method": "AMOUNT_DATE",
  "amount_delta": 0,
  "multiple_candidates": false,
  "high_value": false,
  "conflicting_evidence": true
}
```

**Expected JSON Output Schema:**
```json
{
  "classification": "string",
  "summary": "string",
  "supporting_evidence": ["string"],
  "contradicting_evidence": ["string"],
  "recommended_decision": "MATCHED|REVIEW|EXCEPTION",
  "recommended_action": "string",
  "confidence": 0.95
}
```

### Fallback Handling
If:
- `GEMINI_API_KEY` is missing or invalid
- Network timeout occurs
- The model response fails JSON parsing or does not contain a valid `recommended_decision`

The system safely catches the exception and returns:
```python
{
    "classification": "AI_FAILURE",
    "summary": "Gemini request failed.",
    "supporting_evidence": [],
    "contradicting_evidence": [],
    "recommended_decision": "REVIEW",
    "recommended_action": "Manual review required.",
    "confidence": 0.0
}
```
**A failure in AI will never result in an unreviewed automatic match.**

---

## 2. Interactive Copilot (`ask_arivo`)

### When is it invoked?
Via `POST /api/ask` when a user interacts with the Ask Arivo page in the frontend.

### Context Grounding
The prompt uses strict policy context:
```
You are Arivo, a finance copilot. Answer the user's question grounded strictly on the provided context.
Do not invent financial facts or record IDs.

Context:
ARIVO Policy: Unexplained deltas must always be routed to EXCEPTION.
Ambiguous matches above 50,000 INR require manual REVIEW.
High-value transactions (>500,000 INR) are always blocked by the Control Gate...
```

This prevents hallucinations and enforces consistent policy explanations.
