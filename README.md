# ARIVO - AI Finance Controller
### Razorpay AI Buildathon 2026 - Track 04

> **"Know where every rupee went - or know exactly why you don't."**
> 
> *AI investigates. Rules verify. Controls protect. Arivo decides. Humans resolve ambiguity.*

---

## Executive Summary

**ARIVO** is an enterprise-grade AI Finance Controller built specifically for modern finance teams and high-volume merchants. It bridges the critical trust gap between probabilistic AI systems and deterministic accounting rules.

Instead of trusting LLM outputs for financial balance sheets, ARIVO implements an **Authoritative Control Gate Architecture**:
- **Deterministic Rules Engine**: High-throughput (11,900+ records/sec) matching of ledger payments to settlement batches.
- **Gemini 2.5 AI Copilot**: Deep forensic investigation of genuine ambiguity, fee structure anomalies, and reconciliation disputes.
- **Authoritative Control Gate**: Absolute veto authority over any auto-match. Even if Gemini expresses 99% confidence, any violation of financial invariants (delta mismatch, candidate ambiguity, high-value threshold) immediately enforces human controller review.
- **Dual-Source Ingestion**:
  1. *Controlled Synthetic Benchmark*: Over 5,000 ground-truth transactions with complex real-world edge cases.
  2. *Live Razorpay Test-Mode Integration*: Ingestion of real payments and settlements from Razorpay's API with strict normalization and last-known-good snapshot preservation.

---

## Flagship AI Safety Demo: "The AI is Confident. The System is Not."

A hallmark of enterprise financial controls is that **AI confidence must never override accounting integrity**:

```
Transaction: PAY_FLAGSHIP_001 (₹6,00,000.00)
├── Gemini AI Investigation:    "Strong contextual match based on amount and customer ref."
│                               Recommendation: MATCHED (Confidence: 97%)
├── Authoritative Control Gate:  BLOCK
│                               Reasons:
│                                 [!] High-value transaction threshold exceeded (≥ ₹50,000)
│                                 [!] Multiple candidate settlements detected in window
└── ARIVO Final Decision:        REVIEW (Mandatory Dual-Signoff)
```

In the benchmark and in the live UI:
- **Naive Baseline**: Auto-matches the record, creating ₹6,00,000 in undetected false exposure.
- **ARIVO**: Blocks the match, forcing it to the Controller Review queue, maintaining **0 False Auto-Matches** across the entire dataset.

---

## Key Capabilities & Technical Highlights

1. **Deterministic Minor Currency Units (Paise)**:
   - All financial amounts are stored and calculated strictly as minor units (integer paise).
   - Zero floating-point drift: `₹1,000.50` = `100050` paise.

2. **Settlement Waterfall Accounting**:
   $$\text{Expected Net} = \text{Gross} - \text{Fees} - \text{Tax} - \text{Refunds} - \text{Chargebacks} + \text{Adjustments}$$
   Any deviation between calculated net and deposited net is flagged as `unexplained_delta`.

3. **Hero Metric: Unresolved Financial Exposure**:
   - Replaces generic transaction counts with monetary exposure:
     $$\text{Unresolved Exposure} = \text{Review Exposure} + \text{Exception Exposure} + \text{High-Value at Risk}$$

4. **Deterministic 7-Day Cash Forecast**:
   - Distinguishes **Confirmed Cash** (reconciled funds in bank) from **Expected Settlements** (T+2 gateway pipeline) and **Unresolved Exposure**.
   - Zero hallucinated revenue or false liquidity assumptions.

5. **7 Core Financial Invariant Checks**:
   - Population conservation (every payment accounted for).
   - Waterfall balance across all settlement batches.
   - Duplicate settlement allocation prevention.
   - Currency uniformity (strict INR enforcement).
   - High-value dual sign-off protection.
   - Unexplained delta containment.
   - AI schema compliance.

6. **Grounded AI Finance Copilot ("Ask Arivo")**:
   - Answers natural language questions by querying verified database records.
   - Zero hallucinated numbers. Includes clickable record chips that open the full **Evidence Drawer**.

---

## Benchmark Comparison

Evaluated on 5,114 ground-truth records:

| Metric | Naive LLM / Fuzzy Baseline | ARIVO Controller | Difference |
|---|---|---|---|
| **Throughput** | 120 rec/s | **11,960.7 rec/s** | **+99.6x faster** |
| **Precision** | 72.86% | **70.83%** | Calibrated |
| **Recall** | 100.00% | **91.52%** | Protected |
| **False Auto-Matches** | 1,323 false matches | **0 False Auto-Matches** | **100% Protected** |
| **Prevented False Exposure**| ₹0.00 | **₹4,65,305.00** | Direct Value |

---

## Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) Razorpay Test-Mode Key ID and Secret in `.env`
- (Optional) Google Gemini API Key in `.env`

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/your-repo/arivo.git
cd arivo

# Copy environment template
cp .env.example .env
```

Edit `.env` (optional for live test mode, synthetic mode works out of the box):
```env
RAZORPAY_KEY_ID=rzp_test_YourKeyId
RAZORPAY_KEY_SECRET=YourKeySecret
GEMINI_API_KEY=AIzaSy...
```

### 2. Backend Setup & Run

```bash
# Activate virtual environment
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS

# Run Pytest suite (21 unit tests covering all layers)
python -m pytest backend/tests/ -v

# Run Controlled Benchmark
python evaluation/benchmark.py

# Start FastAPI server (Port 8000)
python -m uvicorn backend.main:app --port 8000 --reload
```

### 3. Frontend Setup & Run

```bash
cd frontend
npm install
npm run build     # Verify clean production build
npm run dev       # Start Vite dev server on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
arivo/
├── backend/
│   ├── main.py                     # FastAPI application (18 REST endpoints)
│   ├── database.py                 # SQLite models + non-destructive column migration
│   ├── ai/
│   │   └── gemini.py               # Gemini investigation + grounded Ask Arivo
│   ├── engine/
│   │   ├── reconciliation.py       # Deterministic matching core + duplicate prevention
│   │   ├── control_gate.py         # Authoritative Control Gate (7 financial invariants)
│   │   ├── cash_forecast.py        # 7-day cash forecast (Confirmed vs Pipeline)
│   │   └── system_health.py        # 7 continuous integrity checks
│   ├── integrations/
│   │   └── razorpay/
│   │       ├── client.py           # Server-side HTTP Basic Auth client + pagination
│   │       ├── normalizer.py       # Paise conversion + settlement waterfall validation
│   │       ├── sync.py             # Sync lifecycle + snapshot resilience
│   │       └── errors.py           # Typed structured exception hierarchy
│   └── tests/
│       ├── test_reconciliation.py  # Matching rules & baseline tests
│       ├── test_control_gate.py    # Gate enforcement
│       ├── test_razorpay_client.py # Client pagination & error mapping
│       ├── test_normalizer.py      # Waterfall & paise conversion tests
│       ├── test_cash_forecast.py   # Forecast & health checks
│       └── test_adversarial.py     # Flagship AI safety demo & edge cases
├── frontend/
│   ├── src/
│   │   ├── api.ts                  # Typed API client + INR currency formatting
│   │   ├── App.tsx                 # Navigation routing & top provider status
│   │   ├── components/
│   │   │   └── EvidenceDrawer.tsx  # Full audit drawer with financial waterfall
│   │   └── pages/
│   │       ├── Overview.tsx        # Hero exposure card, 7-day forecast, health audit
│   │       ├── Reconciliation.tsx  # Multi-filtered ledger + Evidence Drawer
│   │       ├── Exceptions.tsx      # Ranked exposure ledger + CSV export
│   │       ├── Settlements.tsx     # Settlement batches & waterfall drawer
│   │       ├── Ask.tsx             # Grounded Copilot with actionable record chips
│   │       ├── Runs.tsx            # Historical execution log
│   │       └── Benchmark.tsx       # Baseline vs ARIVO + Flagship Safety Demo
├── evaluation/
│   └── benchmark.py                # 5,000+ record controlled ground-truth benchmark
└── docs/                           # Comprehensive technical documentation
```

---

## License

Built for the **Razorpay AI Buildathon 2026**. All rights reserved.
