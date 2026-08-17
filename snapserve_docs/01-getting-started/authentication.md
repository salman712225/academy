<!-- Source: https://app.snapserve.ai/docs/authentication -->

# Authentication

Copy page
Server-to-server requests use a developer API key (`sk_live_…`). Keys are shown once when created — store them in a secret manager.

## Create a key

1. Sign in at [app.snapserve.ai](https://app.snapserve.ai).
1. Open [API Keys](https://app.snapserve.ai/app/api-keys) in the dashboard.
1. Create a key, copy the full value immediately.

Up to **5 active keys** per account. Revoke unused keys.

Never expose sk_live_ in browsers

API keys authenticate as your full account. Use them only from your backend, workers, or secure server environments — not React, mobile apps, or public clients.
## Authorization header

Every request needs:

httpCopy
```
`Authorization: Bearer sk_live_YOUR_KEY
Content-Type: application/json`
```

bashCopy
```
`export SNAPSERVE_API_KEY=sk_live_YOUR_KEY

curl https://app.snapserve.ai/api/agents \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY" \
  -H "Content-Type: application/json"`
```

## Auth errors

jsonCopy
```
`{ "error": "Unauthorized" }
{ "error": "Invalid or revoked API key" }`
```

Both return HTTP `401`. See [Errors](/docs/errors).

## Dashboard sessions

The web app uses a separate session JWT after login. That path is for browsers only. Your application should always use `sk_live_`.

## Next

Follow the [Quick Start](/docs/quick-start) to list agents and place a call, or connect [Claude skill & MCP](/docs/claude-skill) to operate SnapServe from Claude Desktop / Claude Code.