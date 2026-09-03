# ARIVO Fee & Tax Schedule Policy

- **Policy Name**: Gateway Processing Fees, MDR, and GST Compliance Policy
- **Policy Version**: 2.3.0
- **Effective Date**: 2026-01-01
- **Domain**: Merchant Discount Rates (MDR), Platform Surcharges, and Goods & Services Tax (GST)
- **Status**: Authoritative

---

## 1. Purpose & Scope
This policy defines the standard fee structures, contractual MDR rate bounds, and mandatory GST calculations applicable to all payment settlement batches processed through ARIVO.

---

## 2. Standard Rates & Schedules

### Standard Merchant Discount Rates (MDR)
- **UPI (Peer-to-Merchant)**: 0.00% standard MDR for domestic retail transactions up to ₹2,000.
- **RuPay Debit Cards**: 0.00% standard MDR mandated by RBI / NPCI guidelines.
- **Other Debit Cards (Visa/Mastercard)**: 0.40% to 0.90% based on merchant turnover classification.
- **Domestic Credit Cards**: 1.75% to 2.00% flat fee per transaction.
- **International Credit Cards / Amex**: 2.95% to 3.50% plus currency conversion markup.
- **Netbanking**: Flat fee of ₹12.00 to ₹18.00 per transaction or 1.50% capped.

### Goods & Services Tax (GST)
- Statutory GST of **18.00%** applies strictly to processor processing fees and service charges.
- GST does not apply to the gross transaction principal amount.
- **Tax Calculation Formula**:
  $$\text{Tax (paise)} = \text{round}(\text{Fee (paise)} \times 0.18)$$

---

## 3. Invariant Rules

### Rule FEE-001: Fee Bounding Invariant
For standard domestic transactions, total processing fees plus tax must not exceed **4.00%** of the gross transaction value.
Any settlement batch wherein $\frac{\text{Fees} + \text{Tax}}{\text{Gross}} > 0.04$ triggers an automated `FEE_SCHEDULE_AUDIT` warning.

### Rule FEE-002: Monthly Tax Invoicing Reconciliation
Payment gateway monthly GST tax invoices (GSTR-1 / GSTR-2B) must match the cumulative sum of `tax` line items recorded across daily settlement batches. Any cumulative discrepancy greater than ₹100.00 per calendar month requires processor escalation.
