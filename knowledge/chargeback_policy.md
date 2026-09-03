# ARIVO Chargeback & Dispute Policy

- **Policy Name**: Disputed Transactions & Chargeback Settlement Policy
- **Policy Version**: 2.2.0
- **Effective Date**: 2026-01-01
- **Domain**: Card Schemes, UPI Disputes, Representment, and Escrow Withholding
- **Status**: Authoritative

---

## 1. Purpose & Scope
This policy establishes standard operating procedures for managing payment disputes, fraud notifications, and acquiring bank chargebacks across card networks (Visa, Mastercard, RuPay) and UPI infrastructure.

---

## 2. Invariant Rules

### Rule CBK-001: Immediate Settlement Withholding
Upon issuance of a dispute or Retrieval Request by the cardholder's issuing bank:
- The payment gateway withholds the full disputed transaction value plus a non-refundable dispute administration fee from the subsequent settlement cycle.
- The corresponding transaction is assigned status `DISPUTED` in ARIVO.

### Rule CBK-002: Settlement Waterfall Inclusion
Chargeback withholdings appear as deductions in the settlement waterfall formula:
$$\text{Net Amount} = \text{Gross} - \text{Fees} - \text{Tax} - \text{Refunds} - \mathbf{Chargebacks} + \text{Adjustments}$$
Any discrepancy between processor chargeback notices and settlement deductions must be quarantined as an unexplained delta.

### Rule CBK-003: Representment and Dispute Reversal
If the merchant successfully contests the dispute with compelling evidence (proof of delivery, KYC verification, signed delivery challan):
- The processor reverses the deduction in a subsequent settlement cycle under the `adjustments` credit line.
- The controller must link the adjustment reference directly to the original chargeback case before releasing the reserve.

### Rule CBK-004: Excessive Chargeback Thresholds
Card scheme rules mandate that the merchant's monthly chargeback-to-transaction ratio remain below **0.9%** (and fewer than 100 disputes per month). Any trend approaching 0.75% generates an automated Treasury compliance alert.
