# Engineering Failures & Lessons

## 1. Initial Prompt Schema Non-Compliance
**What broke?** Early versions of the Gemini investigator returned markdown-wrapped JSON (e.g. ```json ... ```), which failed `json.loads()`.
**Impact?** The backend crashed during reconciliation for ambiguous cases.
**Root cause?** The prompt did not explicitly force strict raw JSON or the API parameters weren't strict enough.
**Fix?** Added `response_mime_type: "application/json"` to the Gemini generation config.
**Lesson?** Always enforce schema at the SDK level when possible, rather than relying solely on prompt instructions.

## 2. High Value Anomaly Auto-Match
**What broke?** A high value payment (₹1,000,000) was automatically matched by the deterministic engine due to amount and date alignment.
**Impact?** Allowed potential financial risk to bypass human review.
**Root cause?** The Control Gate was not checking the absolute value of the amount.
**Fix?** Added `high_value` flag in candidate generation and blocked it in `validate_match`.
**Lesson?** Financial invariants must include absolute thresholds, not just relative deltas.
