# ARIVO — Technical Documentation Hub
### Razorpay AI Buildathon 2026 — Track 04

Welcome to the internal documentation for **ARIVO**, an AI Finance Controller built with deterministic financial controls and grounded AI investigation.

---

## Documentation Index

| Guide | Description |
|---|---|
| [System Architecture](./ARCHITECTURE.md) | Component interaction, control flow, and safety boundaries |
| [Razorpay Integration Guide](./RAZORPAY.md) | API client, webhook receiver, test-mode synchronization, and error handling |
| [API Endpoints Reference](./API_ENDPOINTS.md) | Complete documentation of all 18 FastAPI REST endpoints |
| [Database Schema & Migrations](./DATABASE.md) | Table definitions, SQLite migration strategy, and integer paise units |
| [Backend Architecture & Engines](./BACKEND.md) | Reconciliation engine, Control Gate, Cash Forecast, and Invariants |
| [Environment & Configuration](./ENVIRONMENT.md) | Environment variables, security keys, and safe default behavior |
| [Testing & Verification Guide](./TESTING.md) | Running unit tests, adversarial test suite, and controlled benchmark |
| [Changelog & Upgrade History](./CHANGELOG.md) | Comprehensive log of architecture upgrades, bug fixes, and additions |

---

## Core System Invariants

1. **Deterministic Authority**: The Control Gate has absolute veto power over any match. AI recommendations (even at 99% confidence) cannot bypass financial invariants.
2. **Integer Minor Units**: All monetary values are handled and stored as integer paise. Floating-point numbers are prohibited in reconciliation arithmetic.
3. **Dual-Source Ingestion**: Synthetic benchmark dataset preserves controlled ground truth. Razorpay Test-Mode integration ingests real provider records.
4. **Resilience & Snapshot Safety**: External API network or auth failures never compromise existing dashboard data; last-known-good snapshots are always preserved.
5. **Zero Credential Exposure**: Razorpay secret keys are restricted to server-side environments and sanitized in logs.
