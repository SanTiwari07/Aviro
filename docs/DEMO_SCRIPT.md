# ARIVO Demo Script (5 Minutes)

**0:00 - Problem Statement**
"Finance teams need to know where every rupee went. The hard part is knowing what reconciled, what didn't, and whether an AI's automated decision is safe."

**0:30 - Overview**
Show the ARIVO dashboard. Highlight the clear metrics: Processed, Matched, Review, Exceptions, and Cash Position.

**1:00 - Clean Match**
Go to Reconciliation. Click a "MATCHED" case. Open Evidence Drawer. Show that exact ID match resulted in 0 delta, bypassing AI entirely.

**1:20 - Fuzzy Reference**
Show a case with a reference typo that was caught by the deterministic engine.

**1:40 - Grouped Settlement / Refund Waterfall**
Explain the Settlement Waterfall logic where `Expected Settlement = Gross - Refunds - Fees - Tax`.

**2:40 - Real Exception**
Show a case flagged as "EXCEPTION" due to an unexplained delta of ₹500.

**3:10 - Gemini Investigation**
Show an ambiguous case where Gemini investigated. Highlight the Evidence Drawer showing AI's recommendation and confidence score.

**4:00 - The Flagship Moment: Control Gate Block**
Show a high-value (₹249,999) ambiguous case. 
- AI Recommendation: MATCH (97% Confidence).
- Control Gate: BLOCKED (Reasons: Multiple candidates, High value).
- Final Arivo Decision: REVIEW.
"Arivo doesn't automate uncertainty away. Rules verify, AI investigates, Controls protect."

**4:30 - Ask Arivo**
Open "Ask Arivo". Ask: "Why are unexplained deltas routed to exception?"
Show the grounded response using the RAG policy.

**4:50 - Benchmark**
Run `make benchmark` to prove the metrics and safety of the system.

**5:00 - Closing**
"Know exactly where every rupee went—or know exactly why you don't. Thank you."
