# Security & Controls

## Gemini API Handling
- `GEMINI_API_KEY` is loaded strictly on the backend.
- It is never exposed to the browser or frontend.
- API calls are isolated in `backend/ai/gemini.py`.

## Data Handling
- Financial invariants are enforced in deterministic code.
- Gemini is never allowed to execute arbitrary SQL or perform definitive arithmetic calculations.
- Control Gate acts as a definitive barrier against unsafe automation.

## Human Review
- All AI recommendations can be overridden by a human in the UI.
- All actions leave an audit trail in the backend database.
