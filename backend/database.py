import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker

import logging

logger = logging.getLogger("arivo.database")

# Ensure one single authoritative absolute database path rooted at the project root
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
default_db_path = os.path.abspath(os.path.join(project_root, "arivo.db"))

raw_db_url = os.getenv("DATABASE_URL", "").strip()
if not raw_db_url or raw_db_url in ("sqlite:///./arivo.db", "sqlite:///arivo.db"):
    DATABASE_URL = f"sqlite:///{default_db_path}"
elif raw_db_url.startswith("sqlite:///"):
    path_part = raw_db_url.replace("sqlite:///", "")
    if not os.path.isabs(path_part):
        path_part = os.path.abspath(os.path.join(project_root, path_part.lstrip("./")))
    DATABASE_URL = f"sqlite:///{path_part}"
else:
    DATABASE_URL = raw_db_url

logger.info(f"[database] Authoritative database URL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String, unique=True, index=True)
    order_id = Column(String, index=True, nullable=True)
    merchant_id = Column(String, index=True, nullable=True)
    amount = Column(Integer)  # minor units (paise)
    currency = Column(String, default="INR")
    status = Column(String)
    created_at = Column(String)
    reference = Column(String, nullable=True)
    source = Column(String, default="synthetic", index=True)  # synthetic | razorpay_test
    source_record_id = Column(String, nullable=True)
    sync_id = Column(String, index=True, nullable=True)
    fee = Column(Integer, default=0)
    tax = Column(Integer, default=0)
    method = Column(String, nullable=True)


class Settlement(Base):
    __tablename__ = "settlements"
    id = Column(Integer, primary_key=True, index=True)
    settlement_id = Column(String, unique=True, index=True)
    merchant_id = Column(String, index=True, nullable=True)
    gross_amount = Column(Integer)
    fees = Column(Integer, default=0)
    tax = Column(Integer, default=0)
    refunds = Column(Integer, default=0)
    chargebacks = Column(Integer, default=0)
    adjustments = Column(Integer, default=0)
    net_amount = Column(Integer)
    currency = Column(String, default="INR")
    status = Column(String)
    created_at = Column(String)
    payment_reference = Column(String, nullable=True)
    source = Column(String, default="synthetic", index=True)
    source_record_id = Column(String, nullable=True)
    sync_id = Column(String, index=True, nullable=True)
    utr = Column(String, nullable=True)
    unexplained_delta = Column(Integer, default=0)


class ReconciliationCase(Base):
    __tablename__ = "reconciliation_cases"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True)
    run_id = Column(String, index=True)
    payment_id = Column(String, index=True, nullable=True)
    settlement_id = Column(String, index=True, nullable=True)
    bank_txn_id = Column(String, nullable=True)
    status = Column(String)  # MATCHED, REVIEW, EXCEPTION
    match_method = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_recommendation = Column(String, nullable=True)
    ai_summary = Column(String, nullable=True)
    ai_evidence = Column(String, nullable=True)  # JSON-encoded array
    ai_reason = Column(String, nullable=True)    # why AI was or was not used
    control_result = Column(String, nullable=True)  # PASS, BLOCK
    control_reasons = Column(String, nullable=True)  # JSON-encoded array
    financial_impact = Column(Integer, default=0)
    amount_delta = Column(Integer, default=0)
    source = Column(String, default="synthetic", index=True)
    source_record_id = Column(String, nullable=True)
    sync_id = Column(String, index=True, nullable=True)
    created_at = Column(String)
    resolved_by = Column(String, nullable=True)
    resolution_action = Column(String, nullable=True)
    resolution_notes = Column(String, nullable=True)
    resolved_at = Column(String, nullable=True)


class SyncRecord(Base):
    __tablename__ = "sync_records"
    id = Column(Integer, primary_key=True, index=True)
    sync_id = Column(String, unique=True, index=True)
    source = Column(String, index=True)  # synthetic | razorpay_test
    started_at = Column(String)
    completed_at = Column(String, nullable=True)
    status = Column(String)  # PENDING, SUCCESS, FAILED
    payments_fetched = Column(Integer, default=0)
    settlements_fetched = Column(Integer, default=0)
    records_normalized = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    pages_fetched = Column(Integer, default=0)
    error_code = Column(String, nullable=True)
    error_message = Column(String, nullable=True)


class ReconciliationRun(Base):
    __tablename__ = "reconciliation_runs"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, unique=True, index=True)
    source = Column(String, index=True)  # synthetic | razorpay_test
    sync_id = Column(String, index=True, nullable=True)
    timestamp = Column(String)
    records_processed = Column(Integer, default=0)
    matched = Column(Integer, default=0)
    review = Column(Integer, default=0)
    exception = Column(Integer, default=0)
    duration_ms = Column(Float, default=0.0)
    throughput = Column(Float, default=0.0)
    ai_investigations = Column(Integer, default=0)
    ai_failures = Column(Integer, default=0)


def _ensure_sqlite_columns():
    """
    Safely adds newly defined columns to existing SQLite tables
    without destroying existing data.
    """
    with engine.connect() as conn:
        tables_to_check = {
            "payments": [
                ("source", "TEXT DEFAULT 'synthetic'"),
                ("source_record_id", "TEXT"),
                ("sync_id", "TEXT"),
                ("fee", "INTEGER DEFAULT 0"),
                ("tax", "INTEGER DEFAULT 0"),
                ("method", "TEXT"),
            ],
            "settlements": [
                ("source", "TEXT DEFAULT 'synthetic'"),
                ("source_record_id", "TEXT"),
                ("sync_id", "TEXT"),
                ("utr", "TEXT"),
                ("unexplained_delta", "INTEGER DEFAULT 0"),
            ],
            "reconciliation_cases": [
                ("ai_summary", "TEXT"),
                ("ai_evidence", "TEXT"),
                ("ai_reason", "TEXT"),
                ("control_reasons", "TEXT"),
                ("amount_delta", "INTEGER DEFAULT 0"),
                ("source", "TEXT DEFAULT 'synthetic'"),
                ("source_record_id", "TEXT"),
                ("sync_id", "TEXT"),
                ("resolved_by", "TEXT"),
                ("resolution_action", "TEXT"),
                ("resolution_notes", "TEXT"),
                ("resolved_at", "TEXT"),
            ]
        }
        for table, cols in tables_to_check.items():
            try:
                res = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
                existing_cols = {row[1] for row in res}
                for col_name, col_def in cols:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
                conn.commit()
            except Exception:
                pass


# Create all tables and apply non-destructive column additions
Base.metadata.create_all(bind=engine)
_ensure_sqlite_columns()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
