<!-- Source: https://app.snapserve.ai/docs/errors -->

# Errors

Copy page
Failed requests return JSON { "error": "…" } (sometimes with code or issues). Treat non-2xx as failures.

## HTTP status codes

| Status | Meaning |
| 401 | Missing/invalid session or sk_live_ key |
| 400 | Validation failed — check issues[] or error string |
| 402 | Payment / wallet — often insufficient balance |
| 403 | Forbidden (suspended account, compliance block) |
| 404 | Resource not found or not owned by this account |
| 409 | Conflict (e.g. number already taken) |
| 429 | Rate limited — back off and retry |
| 5xx | Server / upstream provider error — retry with jitter |

## Auth examples

jsonCopy
```
`{ "error": "Unauthorized" }
{ "error": "Invalid or revoked API key" }`
```

Prefer [webhooks](/docs/webhooks) over tight polling loops to avoid `429`.
## Rate limits

Authenticated traffic has a higher per-user allowance than anonymous IP limits. On `429`, wait and retry with backoff.

## Idempotency

Do not spam identical `POST /calls/outbound` on network timeouts without checking whether a call was already created (list recent calls or store your own idempotency key).