# ARIVO Webhooks Reference

> **Endpoint:** `POST /api/webhooks/razorpay`  
> **Signature Header:** `X-Razorpay-Signature` (HMAC-SHA256)  
> **Implementation:** `backend/main.py:1100` (`razorpay_webhook`)

ARIVO implements an asynchronous webhook listener designed to receive real-time lifecycle event notifications directly from Razorpay.

---

## 1. Supported Webhook Events

| Event Type | Trigger | System Action |
|---|---|---|
| `payment.captured` | Payment successfully captured by Razorpay. | Validates payload, converts amounts to integer paise, upserts into `payments` table. |
| `settlement.processed` | Settlement batch finalized and dispatched to bank. | Calculates settlement waterfall, checks gross vs fees vs tax, upserts into `settlements` table. |

---

## 2. Security & Signature Verification

To guarantee authenticity and prevent tampering, every incoming request must include the `X-Razorpay-Signature` HTTP header. ARIVO validates the signature using HMAC-SHA256:

$$\text{Expected Signature} = \text{HMAC-SHA256}(\text{Raw Request Body}, \text{RAZORPAY\_WEBHOOK\_SECRET})$$

```python
# Signature verification logic in backend/main.py
body_bytes = await request.body()
if webhook_secret:
    expected_signature = hmac.new(
        webhook_secret.encode("utf-8"),
        body_bytes,
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected_signature, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
```

If `RAZORPAY_WEBHOOK_SECRET` is set in `.env` and the signature does not match, the request is immediately rejected with `400 Bad Request`.

---

## 3. Idempotency & Replay Protection

Payment gateways may retry webhooks if network latency delays the HTTP response:
1. ARIVO extracts the unique `event_id` and entity ID (`payment_id` or `settlement_id`).
2. The persistence layer executes an **upsert** operation. If a transaction with the identical ID already exists, the record is updated idempotently rather than duplicated.
3. The endpoint returns `200 OK` with JSON confirmation:
   ```json
   {
     "status": "processed",
     "event": "payment.captured",
     "entity_id": "pay_O72hKlmX123"
   }
   ```

---

## 4. Testing Webhooks Locally

You can test webhook delivery locally using `curl`:

```bash
# 1. Compute HMAC SHA-256 signature of your test payload
# 2. Dispatch POST request to the local webhook endpoint:
curl -X POST http://localhost:8000/api/razorpay/webhook \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: <computed_hex_digest>" \
  -d '{
    "entity": "event",
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test_99812",
          "amount": 250000,
          "currency": "INR",
          "status": "captured",
          "order_id": "order_test_123",
          "method": "upi",
          "fee": 500,
          "tax": 90,
          "created_at": 1725450000
        }
      }
    }
  }'
```
