# Arivo

### AI Finance Controller

> Know where every rupee went - or know exactly why you don't.

## Problem
Finance teams need to reconcile financial records across payment, settlement, ledger, refund, chargeback, and bank systems. The hard part is knowing what actually reconciled, what did not, why it did not, and whether an automated decision is safe.

## Solution
Arivo is a deterministic reconciliation engine with AI-assisted investigation for ambiguous cases. 
**Gemini investigates ambiguity. Deterministic controls remain authoritative.**

## Architecture
- **Data Ingestion**: Standardized CSV ingestion for multiple financial entities.
- **Deterministic Reconciliation**: Exact ID, grouped, and fuzzy matching.
- **Control Gate**: Strict financial validation protecting all final decisions.
- **Gemini Investigator**: Analyzes complex cases using retrieved policies.
- **Polished UI**: Dense, professional dashboard and case management.

## Setup
```bash
git clone <repository>
cd arivo
cp .env.example .env
# Edit .env and add GEMINI_API_KEY
make install
make dev
```
