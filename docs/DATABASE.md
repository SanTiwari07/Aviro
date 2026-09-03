# Database Schema & Storage

ARIVO uses SQLite via SQLAlchemy ORM for local persistent storage with deterministic minor currency units (paise) and non-destructive column evolution.

## 1. Engine & Configuration

- **Engine**: SQLite 3
- **ORM**: SQLAlchemy (Declarative Base)
- **File Location**: `arivo.db` at project root
- **Connection**: Managed in `backend/database.py` with `check_same_thread: False`
- **Integer Minor Units**: All monetary values (`amount`, `gross_amount`, `net_amount`, `fee`, `tax`, `financial_impact`, `unexplained_delta`) are stored strictly as minor unit integers (paise).

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    SYNC_RECORDS {
        int id PK
        string sync_id UK
        string provider
        string status
        int payments_count
        int settlements_count
        int duration_ms
        string error_message
        string completed_at
    }

    RECONCILIATION_RUNS {
        int id PK
        string run_id UK
        string source
        int cases_processed
        int cases_saved
        int matched_count
        int review_count
        int exception_count
        int duration_ms
        float throughput
        int ai_invocations
        string created_at
    }

    PAYMENTS {
        int id PK
        string payment_id UK
        string order_id
        string merchant_id
        int amount
        string currency
        string status
        string created_at
        string reference
        string source
        string source_record_id
        string sync_id
        int fee
        int tax
        string method
    }

    SETTLEMENTS {
        int id PK
        string settlement_id UK
        string merchant_id
        int gross_amount
        int fees
        int tax
        int refunds
        int chargebacks
        int adjustments
        int net_amount
        string currency
        string status
        string created_at
        string payment_reference
        string source
        string source_record_id
        string sync_id
        string utr
        int unexplained_delta
    }

    RECONCILIATION_CASES {
        int id PK
        string case_id UK
        string run_id
        string payment_id
        string settlement_id
        string bank_txn_id
        string status
        string match_method
        float ai_confidence
        string ai_recommendation
        string control_result
        int financial_impact
        string created_at
        string source
        string source_record_id
        string sync_id
        int amount_delta
        string control_reasons
        string ai_summary
        string ai_evidence
        string ai_reason
    }

    SYNC_RECORDS ||--o{ PAYMENTS : generates
    SYNC_RECORDS ||--o{ SETTLEMENTS : generates
    RECONCILIATION_RUNS ||--o{ RECONCILIATION_CASES : contains
    PAYMENTS ||--o| RECONCILIATION_CASES : reconciled_in
    SETTLEMENTS ||--o| RECONCILIATION_CASES : reconciled_in
```

---

## 3. Non-Destructive Migrations (`_ensure_sqlite_columns`)

ARIVO implements a non-destructive runtime schema migration function:
```python
_ensure_sqlite_columns(engine)
```
Upon startup, it inspects existing SQLite table columns via `PRAGMA table_info`. If any newly introduced columns are missing, it executes `ALTER TABLE ADD COLUMN` dynamically without dropping existing data or losing existing reconciliation state.
