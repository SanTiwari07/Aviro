import os
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

# Set database path relative to project root
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "arivo.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{db_path}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String, unique=True, index=True)
    order_id = Column(String, index=True)
    merchant_id = Column(String, index=True)
    amount = Column(Integer)  # minor units
    currency = Column(String, default="INR")
    status = Column(String)
    created_at = Column(String)
    reference = Column(String)

class Settlement(Base):
    __tablename__ = "settlements"
    id = Column(Integer, primary_key=True, index=True)
    settlement_id = Column(String, unique=True, index=True)
    merchant_id = Column(String, index=True)
    gross_amount = Column(Integer)
    fees = Column(Integer)
    tax = Column(Integer)
    refunds = Column(Integer)
    chargebacks = Column(Integer)
    adjustments = Column(Integer)
    net_amount = Column(Integer)
    currency = Column(String, default="INR")
    status = Column(String)
    created_at = Column(String)
    payment_reference = Column(String)

class ReconciliationCase(Base):
    __tablename__ = "reconciliation_cases"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True)
    run_id = Column(String, index=True)
    payment_id = Column(String, index=True, nullable=True)
    settlement_id = Column(String, index=True, nullable=True)
    bank_txn_id = Column(String, nullable=True)
    status = Column(String) # MATCHED, REVIEW, EXCEPTION
    match_method = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_recommendation = Column(String, nullable=True)
    control_result = Column(String, nullable=True) # PASS, BLOCK
    financial_impact = Column(Integer, default=0)
    created_at = Column(String)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
