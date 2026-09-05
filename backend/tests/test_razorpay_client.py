import pytest
import urllib.error
from unittest.mock import patch, MagicMock

from backend.integrations.razorpay.client import RazorpayClient
from backend.integrations.razorpay.errors import (
    RazorpayAuthError,
    RazorpayRateLimitError,
    RazorpayTimeoutError,
)


def test_client_initialization_with_credentials():
    client = RazorpayClient(key_id="rzp_test_mock123", key_secret="secret_abc456")
    assert client.is_configured is True
    assert client.key_id == "rzp_test_mock123"
    assert "secret_abc456" not in str(client)  # Zero credential leakage in repr


def test_client_initialization_missing_credentials(monkeypatch):
    monkeypatch.delenv("RAZORPAY_KEY_ID", raising=False)
    monkeypatch.delenv("RAZORPAY_KEY_SECRET", raising=False)
    client = RazorpayClient(key_id="", key_secret="")
    assert client.is_configured is False

    with pytest.raises(RazorpayAuthError) as exc_info:
        client.fetch_payments()
    assert "credentials not configured" in str(exc_info.value).lower()


@patch("urllib.request.urlopen")
def test_fetch_payments_pagination(mock_urlopen):
    # Mock two pages of payments
    page1_data = b'{"items": [{"id": "pay_01", "amount": 1000}], "count": 1}'
    page2_data = b'{"items": [], "count": 0}'

    mock_resp1 = MagicMock()
    mock_resp1.read.return_value = page1_data
    mock_resp1.__enter__.return_value = mock_resp1

    mock_resp2 = MagicMock()
    mock_resp2.read.return_value = page2_data
    mock_resp2.__enter__.return_value = mock_resp2

    mock_urlopen.side_effect = [mock_resp1, mock_resp2]

    client = RazorpayClient(key_id="rzp_test_mock", key_secret="mock_secret")
    payments, pages = client.fetch_payments(count=1, max_pages=2)

    assert len(payments) == 1
    assert pages == 2
    assert payments[0]["id"] == "pay_01"
    assert mock_urlopen.call_count == 2


@patch("urllib.request.urlopen")
def test_auth_error_handling(mock_urlopen):
    err = urllib.error.HTTPError(
        url="https://api.razorpay.com/v1/payments",
        code=401,
        msg="Unauthorized",
        hdrs={},
        fp=MagicMock(read=lambda: b'{"error": {"description": "Invalid key_id"}}'),
    )
    mock_urlopen.side_effect = err

    client = RazorpayClient(key_id="rzp_bad", key_secret="bad_secret")
    with pytest.raises(RazorpayAuthError):
        client.fetch_payments()


@patch("urllib.request.urlopen")
def test_rate_limit_error_handling(mock_urlopen):
    err = urllib.error.HTTPError(
        url="https://api.razorpay.com/v1/payments",
        code=429,
        msg="Too Many Requests",
        hdrs={},
        fp=MagicMock(read=lambda: b'{"error": {"description": "Rate limit exceeded"}}'),
    )
    mock_urlopen.side_effect = err

    client = RazorpayClient(key_id="rzp_test", key_secret="secret")
    with pytest.raises(RazorpayRateLimitError):
        client.fetch_payments()


@patch("urllib.request.urlopen")
def test_timeout_error_handling(mock_urlopen):
    import socket
    mock_urlopen.side_effect = socket.timeout("Operation timed out")

    client = RazorpayClient(key_id="rzp_test", key_secret="secret")
    with pytest.raises(RazorpayTimeoutError):
        client.fetch_payments()
