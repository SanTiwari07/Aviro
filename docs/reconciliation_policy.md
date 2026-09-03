# Reconciliation Policy

**Version**: 1.0
**Effective Date**: 2026-09-02
**Description**: Core matching rules and exception handling for Arivo.

## Core Principles
1. Exact unique identifier matches are authoritative.
2. An unexplained delta between expected settlement and actual settlement must result in an EXCEPTION.
3. If an ambiguity exists (e.g. multiple candidates, no exact ID, only amount match), it must be routed to REVIEW.
4. Transactions with amounts greater than ₹50,000 are considered "High Value" and require stricter evidence. High Value ambiguity must be routed to REVIEW.

## Settlement Waterfall
- Expected Settlement = Gross Payments - Refunds - Chargebacks - Fees - Tax + Adjustments
- If Actual Settlement differs from Expected Settlement, and there is no evidence of additional refunds/chargebacks/fees, the delta is "UNEXPLAINED".
