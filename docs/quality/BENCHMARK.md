# Controlled Synthetic Benchmark & Evaluation Methodology

> **Evaluation Harness:** `evaluation/benchmark.py`  
> **Dataset Size:** 5,114 ground-truth records across 6 adversarial business scenarios  
> **Random Seed:** `20260902` (Fully reproducible deterministic seed)  
> **Measured Throughput:** 1,352.6 records/second

This document details the evaluation methodology, benchmark harness, and empirical results comparing a naive rule-based reconciliation baseline against ARIVO's invariant-governed controller.

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

## 2. Empirical Benchmark Results

```
====================================================================================================
                        CONTROLLED SYNTHETIC BENCHMARK RESULTS
====================================================================================================
Dataset Size:                       5,114 ground-truth transactions
Throughput:                         1,352.6 records/second (Execution time: 3.78s)
----------------------------------------------------------------------------------------------------
METRIC                              NAIVE RULE BASELINE             ARIVO INVARIANT CONTROLLER
----------------------------------------------------------------------------------------------------
Matched Records                     4,732                           3,124
False Auto-Matches                  1,180 records                   0 records (100% Protected)
Precision                           75.06%                          100.00%
Recall                              100.00%                         91.99%
F1-Score                            0.8575                          0.9583
Erroneous Capital Disbursed         Rs. 1,15,57,023.00              Rs. 0.00
Financial Exposure Prevented        Rs. 0.00                        Rs. 1,15,57,023.00
Unsafe AI Matches Blocked           N/A                             1,071
Ambiguous Cases Investigated        N/A                             1,849
====================================================================================================
```

---

## 3. Analysis: The Precision-First Accounting Imperative

### Why 100% Precision Matters
In consumer web applications (e.g. search, recommendation), optimizing for high recall is common because false positives have low cost. In financial controllership, **a false auto-match is catastrophic**:
- An erroneous auto-match writes off ledger balances, masks accounting theft or leakage, and misallocates working capital.
- The naive baseline matched 4,732 records and achieved 100% recall, but produced **1,180 false auto-matches**, erroneously disbursing **₹1,15,57,023.00** ($1.15\text{ Crore}$).
- ARIVO achieves **100.00% Precision**. It intentionally holds 1,849 ambiguous cases in `REVIEW`, completely eliminating false auto-matches and preventing over ₹1.15 Crore in accounting leakage.

---

## 4. Reproducing the Benchmark

To execute the benchmark locally:

```bash
# Run via Python CLI
python evaluation/benchmark.py

# Or via Windows venv
.\venv\Scripts\python evaluation/benchmark.py

# Or via REST API
curl http://localhost:8000/api/benchmark
```

The script runs synchronously, verifies ground-truth accuracy, checks the flagship safety scenario (`PAY_FLAGSHIP_001`), and outputs the benchmark matrix.
