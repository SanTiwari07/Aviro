"""
Custom exception hierarchy for the Razorpay provider integration.
Ensures errors are categorized cleanly and never leak credentials.
"""

class RazorpayError(Exception):
    """Base exception for all Razorpay-related operations."""
    def __init__(self, message: str, status_code: int = None, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class RazorpayAuthError(RazorpayError):
    """Raised when authentication fails (HTTP 401 / bad key/secret)."""
    pass


class RazorpayRateLimitError(RazorpayError):
    """Raised when the provider rate limits requests (HTTP 429)."""
    pass


class RazorpayTimeoutError(RazorpayError):
    """Raised when an API request times out."""
    pass


class RazorpayNetworkError(RazorpayError):
    """Raised when a network or DNS failure prevents connecting to the API."""
    pass


class RazorpayAPIError(RazorpayError):
    """Raised when the API returns an unexpected HTTP 4xx or 5xx status."""
    pass


class RazorpayNormalizationError(RazorpayError):
    """Raised when provider data violates required normalization constraints."""
    pass
