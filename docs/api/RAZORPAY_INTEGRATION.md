# Razorpay Integration Guide — ARIVO Finance Controller

> **Track:** Razorpay AI Buildathon 2026 (Track 04: AI Finance Controller)  
> **Source Modules:** `backend/integrations/razorpay/` (`client.py`, `normalizer.py`, `sync.py`)

ARIVO implements a dual-source ingestion architecture designed to bridge real payment gateway APIs with high-integrity reconciliation controls.

---

## 1. Dual-Source Architecture

1. **Controlled Synthetic Benchmark:** 5,114 ground-truth records exhibiting real-world edge cases (fee drift, delayed settlements, candidate ambiguity, dispute holdbacks).
2. **Live Razorpay Test-Mode Integration:** Server-side ingestion of captured payments (`/v1/payments`) and settlement batches (`/v1/settlements`), strictly normalizing values into minor integer paise.

```
                      ┌──────────────────────────────────────┐
                      │    Razorpay Test Mode API Gateway     │
                      │  GET /v1/payments | /v1/settlements  │
                      └──────────────────┬───────────────────┘
                                         │ (Basic Auth via Server-Side Client)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │   RazorpayClient & Error Hierarchy   │
                      │  Timeout / Backoff / Rate-Limit Safe │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │     Strict Normalization Engine      │
                      │  - Integer paise minor currency units │
                      │  - ISO 8601 UTC timestamp format     │
                      │  - Settlement Waterfall calculation  │
                      │  - Source & Sync ID Provenance tag   │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │     Snapshot Management Service      │
                      │  - Atomic write to DB / Snapshots    │
                      │  - Failure recovery: preserves LKG   │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │  Deterministic Recon & Control Gate  │
                      └──────────────────────────────────────┘
```

---

## 2. Server-Side Security & Credential Hygiene

- **Server-Side Basic Auth:** Credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are read exclusively from environment variables in the Python backend.
- **Zero Frontend Leakage:** The React SPA communicates with the backend via `/api/razorpay/*` endpoints and never receives API secrets.
- **Representation Sanitization:** The `RazorpayClient.__repr__` automatically masks secrets to prevent leakage in debug logs:
  ```python
  def __repr__(self) -> str:
      masked_key = self.key_id[:8] + "..." if self.key_id else "None"
      return f"<RazorpayClient key_id='{masked_key}' authenticated={bool(self.key_secret)}>"
  ```

---

## 3. Configuration

Set the credentials in your local `.env` file:

```env
# Razorpay Test Mode Credentials
RAZORPAY_KEY_ID=rzp_test_YourKeyIdHere
RAZORPAY_KEY_SECRET=YourKeySecretHere
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere

# Environment
PORT=8000
DATABASE_URL=sqlite:///./arivo.db
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 4. Ingestion Lifecycle: Sync $\to$ Validation $\to$ Snapshot $\to$ Persistence

1. **Connection Diagnostic (`GET /api/razorpay/sync/status`):**
   Verifies API key validity against Razorpay's `/v1/payments?count=1` endpoint and measures round-trip latency.
2. **Paginated Data Retrieval (`POST /api/razorpay/sync`):**
   `RazorpayClient.fetch_payments()` and `fetch_settlements()` paginate up to `max_pages=10` using cursor-based pagination.
3. **Canonical Normalization:**
   - Amounts are validated as non-negative 64-bit integers in **paise**.
   - Currency is verified strictly as `INR`.
   - Timestamps are normalized to UTC ISO 8601.
   - Settlement waterfall arithmetic is verified:
     $$\text{Gross} - \text{Fees} - \text{Tax} - \text{Refunds} - \text{Disputes} + \text{Adjustments} = \text{Net}$$
4. **Last-Known-Good (LKG) Resilience:**
   If the upstream gateway experiences an outage, network partition, or rate limit (HTTP 429), ARIVO captures the exception and preserves the **Last-Known-Good Snapshot** so the financial control room remains operational.

---

## 5. Gateway Endpoints in ARIVO

- `GET /api/razorpay/sync/status` — Current synchronization cursor, connection health, and snapshot stats.
- `POST /api/razorpay/sync` — Incremental pull of payments and settlements.
- `POST /api/razorpay/sync/backfill` — Historical date-range backfill.
- `GET /api/razorpay/settlement-recon` — Gateway-specific batch settlement report.
- `POST /api/razorpay/webhook` — Real-time event receiver with HMAC-SHA256 validation.
