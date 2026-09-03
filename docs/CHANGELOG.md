# Changelog

All notable changes, architectural upgrades, and bug fixes made to the ARIVO codebase.

---

## [Track 04 Major Upgrade — AI Finance Controller] - 2026-09-03
*Razorpay AI Buildathon 2026 — Track 04 Implementation*

### Added
- **Live Razorpay Test-Mode Integration**:
  - `backend/integrations/razorpay/client.py`: Server-side HTTP Basic Auth client with standard library `urllib`, pagination (`fetch_payments`, `fetch_settlements`), socket timeouts, and rate-limit backoff.
  - `backend/integrations/razorpay/normalizer.py`: Normalizes raw payloads into strictly typed minor units (paise integers), ISO 8601 UTC timestamps, and validates the settlement waterfall arithmetic:
    $$\text{Gross} - \text{Fees} - \text{Tax} - \text{Refunds} - \text{Chargebacks} + \text{Adjustments} = \text{Net}$$
  - `backend/integrations/razorpay/sync.py`: Sync lifecycle manager (`SYNC -> VALIDATION -> SNAPSHOT -> PERSISTENCE`) that automatically preserves the **Last-Known-Good Snapshot** upon upstream API failure.
  - `backend/integrations/razorpay/errors.py`: Strongly-typed error hierarchy (`RazorpayAuthError`, `RazorpayRateLimitError`, `RazorpayTimeoutError`, `RazorpayNetworkError`, `RazorpayAPIError`, `RazorpayNormalizationError`).
- **Database Architecture Evolution**:
  - `SyncRecord` table: Tracks sync snapshots, item counts, durations, and status.
  - `ReconciliationRun` table: Logs run history, duration, throughput, and AI invocation stats.
  - Data Provenance Columns: Added `source`, `source_record_id`, `sync_id`, `fee`, `tax`, `method`, `utr`, `unexplained_delta`, `amount_delta`, `control_reasons` to `Payment`, `Settlement`, and `ReconciliationCase`.
  - Non-destructive SQLite migration helper `_ensure_sqlite_columns()` applying schema additions safely without dropping existing tables.
- **Deterministic 7-Day Cash Forecast Engine**:
  - `backend/engine/cash_forecast.py`: Generates 7-day cash outlook based on Indian banking T+2 settlement lag models, strictly separating Confirmed Cash (in bank) from Expected Settlements (pipeline) and Unresolved Exposure.
- **Continuous System Integrity Monitor**:
  - `backend/engine/system_health.py`: Validates 7 core financial invariants (Population conservation, waterfall arithmetic, duplicate allocation, currency uniformity, high-value protection, unexplained delta, and AI schema validity).
- **Grounded AI Copilot ("Ask Arivo")**:
  - `backend/ai/gemini.py:ask_arivo_grounded()`: Performs entity extraction against database ledgers, supplying verified facts to Gemini with zero hallucination, plus deterministic rule-based fallback.
- **Expanded Test Suite**:
  - 21 unit and integration tests across `test_reconciliation.py`, `test_razorpay_client.py`, `test_normalizer.py`, `test_cash_forecast.py`, and `test_adversarial.py`.
- **Flagship AI Safety Demo**:
  - Embedded in benchmark and frontend: Record `PAY_FLAGSHIP_001` (₹6,00,000) where Gemini confidence is 97% MATCH, but the Authoritative Control Gate issues a veto BLOCK enforcing REVIEW ("The AI is confident. The system is not.").
- **Frontend Overhaul**:
  - Full Evidence Drawer (`EvidenceDrawer.tsx`) with waterfall breakdown and audit reasons.
  - Active Data Environment toggle (`Synthetic Benchmark` vs `Razorpay Test Mode`).
  - Hero Card: **Unresolved Financial Exposure** with sub-breakdown.
  - 7-Day Cash Forecast timeline cards.
  - Financial Invariant Health panel.
  - Ranked Exception Ledger with RFC 4180 CSV export.
  - Interactive Settlement Batches viewer.
  - Historical Reconciliation Runs view (`Runs.tsx`).
  - Controlled Benchmark & AI Safety showcase (`Benchmark.tsx`).
  - Grounded Copilot chat with suggested prompt chips and clickable evidence chips.

### Fixed
- Fixed Windows runner `%PATH%` executable shim by creating `powershell.cmd`.
- Fixed Windows CP1252 stdout encoding in `benchmark.py` by reconfiguring stdout to UTF-8.
- Fixed duplicate settlement allocation in reconciliation matching engine.
- Fixed missing `tsconfig.json` and Vite client types in frontend.

---

## [Initial Audit & Fix Release] - 2026-09-02

### Fixed
- Removed strict Python wheel pinning in `backend/requirements.txt` for Python 3.13 compatibility.
- Replaced deprecated `google-generativeai` package with modern `google-genai` SDK.
- Fixed string comparison bug in `backend/engine/control_gate.py` (`"MATCH"` -> `"MATCHED"`).
- Resolved database URL conflicts and module import errors.
