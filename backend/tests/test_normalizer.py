import pytest
from backend.integrations.razorpay.normalizer import PaymentNormalizer, SettlementNormalizer
from backend.integrations.razorpay.errors import RazorpayNormalizationError


def test_payment_normalizer_success():
    raw_payment = {
        "id": "pay_test_001",
        "amount": 250000,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_test_99",
        "method": "upi",
        "fee": 500,
        "tax": 90,
        "created_at": 1709472000,
    }
    normalized = PaymentNormalizer.normalize(raw_payment)

    assert normalized["payment_id"] == "pay_test_001"
    assert normalized["amount"] == 250000  # Stored strictly as paise integer
    assert normalized["currency"] == "INR"
    assert normalized["status"] == "CAPTURED"
    assert normalized["method"] == "upi"
    assert normalized["fee"] == 500
    assert normalized["tax"] == 90
    assert "2024" in normalized["created_at"]


def test_payment_normalizer_unsupported_currency():
    raw = {
        "id": "pay_usd_001",
        "amount": 1000,
        "currency": "USD",
        "status": "captured",
    }
    with pytest.raises(RazorpayNormalizationError) as exc_info:
        PaymentNormalizer.normalize(raw)
    assert "Unsupported currency" in str(exc_info.value)


def test_payment_normalizer_negative_amount():
    raw = {
        "id": "pay_neg_001",
        "amount": -500,
        "currency": "INR",
        "status": "captured",
    }
    with pytest.raises(RazorpayNormalizationError) as exc_info:
        PaymentNormalizer.normalize(raw)
    assert "Amount cannot be negative" in str(exc_info.value)


def test_settlement_normalizer_waterfall_calculation():
    raw_settlement = {
        "id": "setl_test_888",
        "amount": 49000,       # Net deposited
        "fees": 800,
        "tax": 200,
        "utr": "UTR_TEST_123456",
        "status": "processed",
        "created_at": 1709472000,
    }
    normalized = SettlementNormalizer.normalize(raw_settlement)

    assert normalized["settlement_id"] == "setl_test_888"
    assert normalized["net_amount"] == 49000
    assert normalized["fees"] == 800
    assert normalized["tax"] == 200
    # Gross = Net + Fees + Tax = 49000 + 800 + 200 = 50000
    assert normalized["gross_amount"] == 50000
    assert normalized["unexplained_delta"] == 0
    assert normalized["utr"] == "UTR_TEST_123456"


def test_settlement_normalizer_delta_detection():
    # Invariant: gross - fees - tax != net
    raw_settlement = {
        "id": "setl_test_discrepant",
        "gross_amount": 50000,
        "amount": 45000,       # Net deposited is 45000
        "fees": 800,
        "tax": 200,
        # Expected net: 50000 - 800 - 200 = 49000. Delta = |49000 - 45000| = 4000 paise
        "status": "processed",
    }
    normalized = SettlementNormalizer.normalize(raw_settlement)

    assert normalized["gross_amount"] == 50000
    assert normalized["net_amount"] == 45000
    assert normalized["unexplained_delta"] == 4000
