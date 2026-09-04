# Razorpay Integration Guide - ARIVO Finance Controller

## 1. Overview & Architecture

ARIVO is an AI Finance Controller built for the **Razorpay AI Buildathon 2026 (Track 04)**. It incorporates a **Dual-Source Ingestion Architecture**:

1. **Controlled Synthetic Benchmark**: Over 5,000 ground-truth transactions with complex real-world financial anomalies (fee drift, missing settlements, split deposits, chargeback deductions).
2. **Live Razorpay Test-Mode Integration**: Server-side ingestion from Razorpay's API (`/v1/payments`, `/v1/settlements`), strictly validating financial figures in minor units (paise) and reconciling real provider transactions.

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

## 2. Security & Zero Credential Leakage

- **Server-Side Only**: Razorpay credentials (`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`) are read strictly via server-side environment variables (`python-dotenv`).
- **No Client Exposure**: The Vite frontend NEVER receives or stores Razorpay secret keys.
- **Log Sanitization**: `RazorpayClient.__repr__` sanitizes secret keys to prevent accidental leakage in console logs or error traces.

---

## 3. Configuration

Add your Razorpay Test-Mode credentials to your `.env` file in the project root:

```env
# Razorpay Test Mode Credentials
RAZORPAY_KEY_ID=rzp_test_YourTestKeyIdHere
RAZORPAY_KEY_SECRET=yourTestKeySecretHere

# Port and Environment
PORT=8000
DATABASE_URL=sqlite:///./arivo.db
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 4. Ingestion Lifecycle: Sync -> Validation -> Snapshot -> Persistence

1. **API Connection Check**: `GET /api/razorpay/status` pings `/v1/payments?count=1` to verify authentication.
2. **Paginated Data Retrieval**: `RazorpayClient.fetch_payments()` and `fetch_settlements()` paginate up to `max_pages=10` using `count` and `skip`.
3. **Normalization**:
   - Amounts are validated as non-negative integers representing **paise** (1 INR = 100 paise).
   - Currency is verified strictly as `INR`.
   - ISO 8601 UTC timestamps are generated from Unix epoch seconds.
   - Settlement waterfall arithmetic is verified:
     $$\text{Gross} - \text{Fees} - \text{Tax} - \text{Refunds} - \text{Chargebacks} + \text{Adjustments} = \text{Net}$$
     Any discrepancy is stored as `unexplained_delta`.
4. **Snapshot & Resilience**:
   - Successful syncs write a metadata record to `sync_records` and persist normalized records.
   - If upstream Razorpay API is down, returns 429, or experiences timeout, ARIVO catches the error gracefully, returns structured diagnostics, and preserves the **Last-Known-Good Snapshot** so the controller dashboard never zeroes out.

---

## 5. Webhooks Support

ARIVO provides a webhook receiver at `POST /api/webhooks/razorpay`.
In production, it verifies HMAC-SHA256 signatures against `RAZORPAY_WEBHOOK_SECRET` before processing payment/settlement event updates.

---

## 6. How to Test Without Live Credentials (Simulated Snapshot)

If no live internet connection or Razorpay keys are available during evaluation:
1. The system automatically initializes with the controlled synthetic dataset in SQLite.
2. The UI allows 1-click toggling between `Synthetic Benchmark` and `Razorpay Test Mode`.
3. All UI cards, Evidence Drawers, and Cash Forecasts render using deterministic SQLite records.
