# API Overview

## Architecture

Arivo's API is a RESTful JSON API built with FastAPI. It is served at `http://localhost:8000` in development. In production, place it behind a reverse proxy.

All routes are prefixed with `/api/`.

The frontend communicates with the API via a Vite dev proxy (in development) or via `VITE_API_URL` (in production). See [ENVIRONMENT.md](./ENVIRONMENT.md).

---

## Request Format

All `POST` requests must include:
```
Content-Type: application/json
```

Request bodies are JSON-encoded.

---

## Response Format

All successful responses return JSON. There is no envelope wrapper - the response body is the direct payload.

Example success:
```json
{"status": "success", "cases_processed": 4985, "cases_saved": 4985}
```

---

## Error Format

FastAPI returns standard HTTP error responses:

```json
{
  "detail": "Dataset not found. Run: make generate-data"
}
```

The `detail` field contains a human-readable error message.

---

## Status Codes Used

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request (missing dataset, empty question) |
| `422` | Validation error (FastAPI auto-generated for malformed JSON) |
| `500` | Unhandled server exception |

---

## Authentication

None. The API has no authentication layer. All endpoints are publicly accessible.

---

## CORS

The backend sets `allow_origins=["*"]` with all methods and headers allowed. This is intentional for the development/demo context. For production, restrict to your frontend domain.

---

## Pagination

`GET /api/reconciliation` accepts a `limit` query parameter (default: 100, frontend requests 200).

There is no cursor-based or page-based pagination.

---

## Rate Limiting

None implemented.

---

## Detailed Endpoint Reference

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete documentation of every endpoint including request/response shapes and curl examples.
