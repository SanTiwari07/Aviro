# ARIVO Refund Policy

- **Policy Name**: Customer Refund Settlement & Reversal Policy
- **Policy Version**: 2.1.0
- **Effective Date**: 2026-01-01
- **Domain**: Refund Lifecycle, Netting Mechanisms, and Void Processing
- **Status**: Authoritative

---

## 1. Purpose & Scope
This policy standardizes the accounting treatment for customer refunds initiated via dashboard or merchant APIs, establishing verification protocols across settlement batches.

---

## 2. Invariant Rules

### Rule REF-001: Netting Against Gross Inflows
Customer refunds are netted directly against daily gross transaction volumes within payment gateway settlement batches:
- If daily gross receipts exceed refund obligations, the net difference is disbursed to the bank.
- If daily refund volume exceeds gross volume, the gateway places the merchant balance in negative carryover or initiates an escrow balance debit.

### Rule REF-002: Refund Traceability
Every refund must maintain a deterministic linkage to:
1. `payment_id`: The original captured payment record.
2. `refund_id`: The unique processor refund entity identifier.
3. `order_id`: The merchant operational purchase order.

### Rule REF-003: Fee and Tax Reversals
- Payment gateway MDR processing fees on refunds are generally non-refundable under standard Indian merchant agreements.
- When promotional or contractual agreements allow fee reimbursement on instant voids, the adjustment must be explicitly audited against the processor fee invoice.

### Rule REF-004: Partial Refunds
A payment may undergo multiple partial refunds up to the cumulative gross authorization. Any refund request exceeding the original captured transaction amount ($\sum \text{Refunds} > \text{Payment Amount}$) is structurally invalid and flagged as an integrity breach.
