<!-- Source: https://app.snapserve.ai/docs/quick-start -->

# Quick Start

Copy page
Authenticate, list agents, and start an outbound call from your backend in a few minutes.

## Prerequisites

- Active **agent** (create one in the dashboard).
- API key — [Authentication](/docs/authentication).
- Wallet balance (₹500 welcome credit on signup).

Tip

Prefer webhooks over polling for production — see [Event subscriptions](/docs/webhooks).
## 1. List agents

bashCopy
```
`export SNAPSERVE_API_KEY=sk_live_YOUR_KEY

curl https://app.snapserve.ai/api/agents \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY"`
```

jsonCopy
```
`[
  {
    "id": 123,
    "name": "Support desk",
    "status": "active",
    "language": "en-IN"
  }
]`
```

Pick an agent with `status: "active"`.

## 2. Place an outbound call

| Parameter | Type | Description |
| `agentId`required | integer | Active agent ID from list/create |
| `toNumber`required | string | Destination in E.164 (e.g. +919876543210) |

cURLNode / TypeScriptPython

bashCopy
```
`curl -X POST https://app.snapserve.ai/api/calls/outbound \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": 123,
    "toNumber": "+919876543210"
  }'`
```

jsonCopy
```
`{
  "id": 456,
  "status": "initiated",
  "agentId": 123,
  "toNumber": "+919876543210"
}`
```

## 3. Get the result

Poll `GET /calls/{id}` or register for `call.completed`. Full guide: [Outbound Calls](/docs/outbound-calls).

## API Client Wrappers

Copy ready-to-use client wrapper classes for TypeScript, Python, and Go: [API Wrappers & SDKs](/docs/sdks). Full OpenAPI interactive schemas: [API Reference](/docs/api-reference).