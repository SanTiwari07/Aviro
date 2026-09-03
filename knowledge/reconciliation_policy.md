# ARIVO Reconciliation Policy

- **Policy Name**: Transaction Reconciliation & Invariant Verification Policy
- **Policy Version**: 2.4.0
- **Effective Date**: 2026-01-01
- **Domain**: Payment Ingestion, Matching Engine, and Exception Routing
- **Status**: Authoritative

---

## 1. Purpose & Scope
This policy defines the deterministic rules, tolerance limits, and invariant boundaries governing the matching of payment records (`PAY_...`) against settlement records (`SET_...`) processed through payment gateways (e.g., Razorpay) and core banking systems.

---

## 2. Invariant Rules

### Rule REC-001: Zero Tolerance on Identifier & Amount
A transaction is considered deterministically matched (`MATCHED`) if and only if:
1. An unambiguous identifier exists connecting payment and settlement (via direct reference `REF-{payment_id}`, normalized alphanumeric reference, or verified gateway payment link).
2. The monetary amount matches with **0 paise tolerance** ($\Delta = 0$). No automatic threshold or fuzzy monetary matching is permitted under any circumstance.

### Rule REC-002: Normalized Reference Resolution
When an exact match misses due to formatting discrepancies (e.g., lowercase vs. uppercase, underscores instead of hyphens, trailing whitespace):
- The identifier normalizer shall sanitize strings by removing whitespace, uppercasing, and standardizing delimiter characters (`_`, ` `, `.`, `/` $\rightarrow$ `-`).
- Normalized matches are valid only when exactly **one** unallocated settlement candidate satisfies the normalized identifier. If multiple candidates resolve to the same normalized form, the case must be marked `REVIEW`.

### Rule REC-003: Duplicate Allocation Prevention
No settlement record may be allocated to more than one payment transaction. If two or more payment records claim the identical settlement reference:
- All matching attempts for that reference must immediately halt.
- The state is locked to `REVIEW` under invariant violation `DUPLICATE_ALLOCATION`.
- Human controller sign-off is mandatory before any disbursement or recognition.

### Rule REC-004: High-Value Threshold Escalation
Any payment or settlement with a gross value equal to or exceeding **₹50,000.00** (5,000,000 paise) is classified as a **High-Value Transaction**.
- For High-Value Transactions, automatic matching is restricted strictly to verified exact identifier matches (`EXACT_ID`).
- Any High-Value Transaction with semantic ambiguity, candidate pools $> 1$, or missing references must be **BLOCKED** by the Control Gate and routed to manual `REVIEW`, regardless of LLM confidence score.

---

## 3. Decision Implications
| Scenario | Deterministic Engine | AI Recommendation | Control Gate Verdict | Final Status |
| :--- | :--- | :--- | :--- | :--- |
| Exact ID + Zero Delta | `EXACT_ID` | Not Required | `PASS` | `MATCHED` |
| Normalized ID + Zero Delta | `NORMALIZED_ID` | Not Required | `PASS` | `MATCHED` |
| Missing ID + Single Amount Candidate (<₹50k) | `AMOUNT_DATE` | `MATCHED` (if confident) | `PASS` | `MATCHED` |
| Missing ID + Single Amount Candidate (≥₹50k) | `AMOUNT_DATE` | `MATCHED` (even 99%) | `BLOCK` (High-Value Ambiguity) | `REVIEW` |
| Multiple Candidates | `MULTIPLE` | Any | `BLOCK` (Candidate Ambiguity) | `REVIEW` |
| Non-Zero Amount Delta | `AMOUNT_MISMATCH` | Any | `BLOCK` (Delta Anomaly) | `EXCEPTION` |
| Duplicate Reference Claim | `DUPLICATE` | Any | `BLOCK` (Duplicate Allocation) | `REVIEW` |
