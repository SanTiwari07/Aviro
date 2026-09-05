"""
Server-side Razorpay API client.
Handles Basic Auth, timeouts, rate limits, pagination, and network errors safely.
Uses standard library urllib for maximum reliability and portability.
"""

import os
import json
import base64
import logging
import urllib.request
import urllib.error
import urllib.parse
from typing import Dict, Any, List, Optional, Tuple

from .errors import (
    RazorpayError,
    RazorpayAuthError,
    RazorpayRateLimitError,
    RazorpayTimeoutError,
    RazorpayNetworkError,
    RazorpayAPIError,
)

logger = logging.getLogger("arivo.razorpay")

DEFAULT_BASE_URL = "https://api.razorpay.com/v1"
DEFAULT_TIMEOUT_SECONDS = 10


class RazorpayClient:
    def __init__(
        self,
        key_id: Optional[str] = None,
        key_secret: Optional[str] = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = DEFAULT_TIMEOUT_SECONDS,
    ):
        self.key_id = (key_id or os.getenv("RAZORPAY_KEY_ID", "")).strip()
        self.key_secret = (key_secret or os.getenv("RAZORPAY_KEY_SECRET", "")).strip()
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        """Returns True if both key ID and key secret are present."""
        return bool(self.key_id and self.key_secret)

    def _get_auth_header(self) -> str:
        if not self.is_configured:
            raise RazorpayAuthError(
                "Razorpay API credentials not configured. Please set API credentials in .env."
            )
        auth_bytes = f"{self.key_id}:{self.key_secret}".encode("utf-8")
        return f"Basic {base64.b64encode(auth_bytes).decode('utf-8')}"

    def _request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes a GET request against the Razorpay REST API.
        Never logs sensitive credentials or tokens.
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        if params:
            query_string = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
            if query_string:
                url = f"{url}?{query_string}"

        req = urllib.request.Request(
            url,
            headers={
                "Authorization": self._get_auth_header(),
                "Accept": "application/json",
                "User-Agent": "Arivo-Finance-Controller/1.0",
            },
            method="GET",
        )

        logger.info(f"[RazorpayClient] Requesting {endpoint} (timeout={self.timeout}s)")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                status_code = response.getcode()
                raw_body = response.read().decode("utf-8")
                try:
                    data = json.loads(raw_body)
                except json.JSONDecodeError as jde:
                    logger.error(f"[RazorpayClient] Malformed JSON response: {jde}")
                    raise RazorpayAPIError(
                        f"Malformed response from Razorpay API for endpoint {endpoint}",
                        status_code=status_code,
                    )
                return data

        except urllib.error.HTTPError as he:
            status_code = he.code
            try:
                err_data = json.loads(he.read().decode("utf-8"))
            except Exception:
                err_data = {"error": {"description": he.reason}}

            err_desc = err_data.get("error", {}).get("description", str(he.reason))
            logger.warning(f"[RazorpayClient] HTTP {status_code} error on {endpoint}: {err_desc}")

            if status_code == 401:
                raise RazorpayAuthError(
                    f"Authentication failed: {err_desc}. Check API credentials.",
                    status_code=401,
                    details=err_data,
                )
            elif status_code == 429:
                raise RazorpayRateLimitError(
                    f"Razorpay rate limit reached: {err_desc}",
                    status_code=429,
                    details=err_data,
                )
            elif status_code >= 500:
                raise RazorpayAPIError(
                    f"Razorpay upstream server error (HTTP {status_code}): {err_desc}",
                    status_code=status_code,
                    details=err_data,
                )
            else:
                raise RazorpayAPIError(
                    f"Razorpay API request error (HTTP {status_code}): {err_desc}",
                    status_code=status_code,
                    details=err_data,
                )

        except urllib.error.URLError as ue:
            # Check for timeout inside URLError
            if "timed out" in str(ue.reason).lower():
                logger.error(f"[RazorpayClient] Connection timed out on {endpoint}")
                raise RazorpayTimeoutError(f"Razorpay API connection timed out: {ue.reason}")
            logger.error(f"[RazorpayClient] Network error on {endpoint}: {ue.reason}")
            raise RazorpayNetworkError(f"Network error connecting to Razorpay: {ue.reason}")

        except TimeoutError:
            logger.error(f"[RazorpayClient] Socket timed out on {endpoint}")
            raise RazorpayTimeoutError("Razorpay API connection timed out after timeout window.")

        except Exception as ex:
            if isinstance(ex, (RazorpayError,)):
                raise
            logger.error(f"[RazorpayClient] Unexpected error on {endpoint}: {ex}")
            raise RazorpayAPIError(f"Unexpected error communicating with Razorpay: {str(ex)}")

    def test_connection(self) -> Dict[str, Any]:
        """
        Validates credentials by pinging payments endpoint with count=1.
        Returns connection diagnostics.
        """
        if not self.is_configured:
            return {
                "connected": False,
                "reason": "Credentials not configured in environment.",
                "key_id_present": bool(self.key_id),
            }
        try:
            res = self._request("payments", {"count": 1})
            return {
                "connected": True,
                "key_id_prefix": self.key_id[:8] + "...",
                "test_mode": True,
                "items_found": res.get("count", 0),
            }
        except RazorpayAuthError as ae:
            return {
                "connected": False,
                "reason": f"Authentication failed: {ae.message}",
                "key_id_present": True,
            }
        except Exception as e:
            return {
                "connected": False,
                "reason": f"Connection failed: {str(e)}",
                "key_id_present": True,
            }

    def fetch_payments(
        self,
        from_time: Optional[int] = None,
        to_time: Optional[int] = None,
        count: int = 100,
        max_pages: int = 10,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Fetches payments with pagination.
        Returns (list_of_payments, pages_fetched).
        """
        all_items: List[Dict[str, Any]] = []
        skip = 0
        pages_fetched = 0

        while pages_fetched < max_pages:
            params = {
                "count": min(count, 100),
                "skip": skip,
                "from": from_time,
                "to": to_time,
            }
            res = self._request("payments", params)
            items = res.get("items", [])
            pages_fetched += 1
            all_items.extend(items)

            # If fewer records than requested were returned, we have reached the end
            if len(items) < params["count"]:
                break

            skip += len(items)

        logger.info(f"[RazorpayClient] Fetched {len(all_items)} payments across {pages_fetched} page(s)")
        return all_items, pages_fetched

    def fetch_settlements(
        self,
        from_time: Optional[int] = None,
        to_time: Optional[int] = None,
        count: int = 100,
        max_pages: int = 10,
    ) -> Tuple[List[Dict[str, Any]], int]:
        """
        Fetches settlements with pagination.
        Returns (list_of_settlements, pages_fetched).
        """
        all_items: List[Dict[str, Any]] = []
        skip = 0
        pages_fetched = 0

        while pages_fetched < max_pages:
            params = {
                "count": min(count, 100),
                "skip": skip,
                "from": from_time,
                "to": to_time,
            }
            res = self._request("settlements", params)
            items = res.get("items", [])
            pages_fetched += 1
            all_items.extend(items)

            if len(items) < params["count"]:
                break

            skip += len(items)

        logger.info(f"[RazorpayClient] Fetched {len(all_items)} settlements across {pages_fetched} page(s)")
        return all_items, pages_fetched
