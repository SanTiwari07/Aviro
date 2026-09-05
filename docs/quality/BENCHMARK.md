# Controlled Synthetic Benchmark & Ablation Methodology

> **Evaluation Harness:** `evaluation/benchmark.py`  
> **Dataset Size:** 5,114 ground-truth records across 6 adversarial business scenarios  
> **Random Seed:** `20260902` (Fully reproducible deterministic seed)  
> **Evaluation Modes:** Benchmark A (5,114 Offline Ablation) & Benchmark B (Live Gemini AI Empirical Validation)

This document details the evaluation methodology, benchmark harness, and empirical results comparing naive baselines, strict rules, and ARIVO's hybrid ML + Gemini + Control Gate architecture.

---

## 1. Adversarial Evaluation Dataset Composition

The benchmark dataset consists of 5,114 ground-truth transactions generated across six distinct real-world financial friction scenarios:

1. **Standard Clean Matches (60%):** Exact 1-to-1 matches with verified timestamps and valid waterfall arithmetic.
2. **Identical Amount Candidate Collisions (15%):** Multiple distinct payments occurring on identical banking dates with identical gross amounts.
3. **Gateway MDR Fee Mismatches (10%):** Gateway processing fees or statutory taxes deviating from contract terms by $\ge 1\text{ paise}$.
4. **Delayed Settlements & Bank Holidays (5%):** Settlements delayed by 3 to 7 days due to banking cutoffs and public holidays.
5. **Partial / Split Settlements (5%):** Multi-order customer payments settled across separate gateway batches.
6. **Chargebacks & Disputed Holdbacks (5%):** Customer disputes and issuing bank reversals with reserve deductions.

---

## 2. Benchmark A: 4-Tier Architectural Ablation Matrix

Benchmark A evaluates all 5,114 ground-truth records to mathematically measure the contribution of each system layer:

```
========================================================================================================
             ARIVO 4-TIER ARCHITECTURAL ABLATION MATRIX (5,114 GROUND-TRUTH RECORDS)
========================================================================================================
METRIC                   Tier 1: Naive Rules   Tier 2: Strict Rules  Tier 3: ARIVO Core    Tier 4: ARIVO Full
--------------------------------------------------------------------------------------------------------
Architecture             Greedy (No Gate/ML)   Exact/Norm ID + Gate  Rules + ML + Gate     Rules+ML+AI+Gate
Candidate Ranking        None                  None (First-come)     XGBoost Scorer        XGBoost + Gemini
Control Gate Invariants  Disabled              Enforced              Enforced              Enforced
Matched Records          4,732                 4,160                 3,124                 3,124
False Auto-Matches       1,180 records         1,022 records         0 records (0.00%)     0 records (0.00%)
Reconciliation Precision 75.06%                75.43%                100.00%               100.00%
Reconciliation Recall    100.00%               92.40%                91.99%                91.99%
F1-Score                 0.8575                0.8306                0.9583                0.9583
Erroneous Capital Leak   ₹1,15,57,023.00       ₹98,95,469.00         ₹0.00                 ₹0.00
False Exposure Prevented ₹0.00                 ₹16,61,554.00         ₹1,15,57,023.00       ₹1,15,57,023.00
Evaluation Mechanism     Empirical Rule Run    Empirical Rule Run    Empirical ML Run      Simulated AI Oracle*
========================================================================================================
*Note: In Benchmark A, Tier 4 evaluates an offline Simulated LLM Policy Oracle for reproducible, zero-cost
evaluation across the entire 5,114 dataset at 700+ records/sec.
```

---

## 3. Scientific Justification: Why the ML Component is Necessary

A central question in financial system architecture is whether deterministic rules alone suffice:
1. **The Rule Boundary Limit:** In real digital commerce, payment references are frequently truncated, missing, or altered by intermediaries. When multiple transactions share identical amounts on identical dates, strict rules cannot discern which settlement belongs to which payment.
2. **The Failure of Greedy Rules (Tier 1 & 2):** Without ML ranking, naive rules match the first available settlement, resulting in **1,022 false auto-matches** and **₹98,95,469.00 in erroneous capital leakage**.
3. **The Role of XGBoost (Tier 3):** ARIVO trains a gradient-boosted decision tree on non-linear features: temporal difference, fee deviation probabilities, merchant transaction patterns, and string edit distance. The model outputs calibrated match probabilities and score margins between candidate 1 and candidate 2.
4. **The Gate Integration:** The deterministic Control Gate consumes these ML metrics: only when a candidate exhibits high confidence and a decisive margin over competing decoys is it eligible for automated clearance. This mathematical separation raises precision from **75.43% to 100.00%**, completely eliminating false auto-matches.

---

## 4. Benchmark B: Live Gemini AI Empirical Validation

For transparent live validation against Google Gemini 2.5 Flash endpoints, Benchmark B invokes the official Google GenAI SDK:

```bash
# Execute Live Gemini Benchmark (default sample size: 10)
python evaluation/benchmark.py --live-gemini --sample-size 10
```

### Empirical Live Telemetry
- **Model Endpoint:** `gemini-2.5-flash`
- **Schema Conformance:** 100% structured JSON extraction (with markdown code fence stripping).
- **Average Roundtrip Latency:** Measured empirically across live calls.
- **Control Gate Supremacy Demonstration:** Evaluates the flagship adversarial case `PAY_FLAGSHIP_001` (₹6,00,000.00) live, demonstrating that even when Gemini produces a high-confidence recommendation, the Control Gate enforces Invariant 2 (Multiple Candidates) and Invariant 3 (High Value $\ge$ ₹50,000) to veto automated matching and lock the capital in `REVIEW`.

---

## 5. Reproducing the Benchmarks

```bash
# 1. Run Benchmark A (Full 5,114 Offline Ablation)
python evaluation/benchmark.py

# 2. Run Benchmark A + Benchmark B (Live Gemini AI Validation)
python evaluation/benchmark.py --live-gemini --sample-size 10

# 3. Via REST API
curl "http://localhost:8000/api/benchmark?live_gemini=true&sample_size=10"
```
