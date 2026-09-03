# ARIVO Control Gate & AI Safety Governance Policy

- **Policy Name**: Authoritative Financial Invariants & AI Boundary Governance Policy
- **Policy Version**: 3.0.0
- **Effective Date**: 2026-01-01
- **Domain**: System Architecture, Control Gate Authority, AI Delegation Boundaries, and Invariant Verification
- **Status**: Authoritative & Mandatory

---

## 1. Core Operating Doctrine
> **"Know where every rupee went — or know exactly why you don't."**  
> *AI investigates. Rules verify. Controls protect. Arivo decides. Humans resolve ambiguity.*

### The Separation Principle
1. **Gemini Investigates**: AI models assess semantic nuances, cross-reference ambiguous records, synthesize explanations, and suggest recommendations.
2. **Rules Verify**: Deterministic pipelines compute integer-precise arithmetic, hash match references, and build candidate evidence pools.
3. **Controls Protect**: The Control Gate evaluates seven immutable mathematical and operational invariants. It holds unilateral, un-overrideable veto power.
4. **Arivo Decides**: The authoritative system state engine assigns the final status (`MATCHED`, `REVIEW`, `EXCEPTION`).
5. **Humans Resolve Ambiguity**: High-value risks and blocked invariants must be signed off by a certified finance controller.

**Golden Invariant**:
> *"The AI is confident. The system is not."*  
> Gemini can investigate. Gemini cannot authorize.

---

## 2. The 7 Core Financial Invariants

### Invariant 1: Population Conservation
$$\text{Input Records} = \text{Matched} + \text{Review} + \text{Exception} + \text{Invalid}$$
Every ingested payment and settlement record must be accounted for and exist in exactly one terminal state. Zero records may be discarded, silently dropped, or double-counted.

### Invariant 2: Settlement Arithmetic
$$\text{Expected Net} = \text{Gross} - \text{Fees} - \text{Tax} - \text{Refunds} - \text{Chargebacks} + \text{Adjustments}$$
All ledger balances must balance with exact paise precision. Any un-reconciled variance is flagged as an unexplained delta.

### Invariant 3: Single Candidate Uniqueness
A transaction match is valid if and only if exactly one candidate satisfies the matching criteria. Multiple candidate settlements for a single payment require manual controller review.

### Invariant 4: Duplicate Allocation Protection
No settlement batch or transaction credit may be matched or disbursed against more than one payment claim.

### Invariant 5: Currency Consistency
All internal reconciliation ledgers and cash forecasts must be unified in the base operational currency (INR). Cross-currency transactions require verified exchange rate settlement records before matching.

### Invariant 6: High-Value Protection Threshold
Any ambiguous transaction with a gross value $\ge \text{₹50,000.00}$ (5,000,000 paise) must be vetoed by the Control Gate if not matched by an exact unique identifier. High confidence AI recommendations (even 99%) cannot override this safeguard.

### Invariant 7: AI Schema & Decision Validation
All AI outputs must pass strict Pydantic/dataclass schema validation, enum conformance (`MATCHED`, `REVIEW`, `EXCEPTION`), confidence clamping ($0.0 \le \text{confidence} \le 1.0$), and hallucination prevention against active database primary keys.
