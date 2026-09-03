import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, Payment, Settlement, ReconciliationCase
from backend.engine.cash_forecast import calculate_cash_forecast
from backend.engine.system_health import check_system_health


@pytest.fixture
def in_memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()


def test_cash_forecast_structure(in_memory_db):
    # Seed sample payment and settlement
    in_memory_db.add(Payment(payment_id="PAY_FC_1", amount=100000, currency="INR", source="synthetic"))
    in_memory_db.add(
        Settlement(
            settlement_id="SET_FC_1",
            gross_amount=100000,
            fees=2000,
            tax=360,
            net_amount=97640,
            currency="INR",
            status="PROCESSED",
            source="synthetic",
        )
    )
    in_memory_db.commit()

    forecast = calculate_cash_forecast(in_memory_db)
    assert "days" in forecast
    assert len(forecast["days"]) == 7
    assert forecast["days"][0]["day_offset"] == 0
    assert forecast["days"][0]["confidence"] == "CERTAIN"
    assert "summary" in forecast


def test_system_health_clean_state(in_memory_db):
    # Seed balanced records
    in_memory_db.add(Payment(payment_id="P_1", amount=50000, currency="INR", source="synthetic"))
    in_memory_db.add(
        Settlement(
            settlement_id="S_1",
            gross_amount=50000,
            fees=1000,
            tax=180,
            net_amount=48820,
            currency="INR",
            source="synthetic",
        )
    )
    in_memory_db.add(
        ReconciliationCase(
            case_id="CASE_1",
            payment_id="P_1",
            settlement_id="S_1",
            status="MATCHED",
            financial_impact=50000,
            source="synthetic",
        )
    )
    in_memory_db.commit()

    report = check_system_health(in_memory_db)
    assert report["overall_status"] in ("HEALTHY", "ALL_SYSTEMS_OPERATIONAL")
    assert report["passed_checks"] == 7
    assert report["total_checks"] == 7
