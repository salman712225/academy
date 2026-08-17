<!-- Source: https://app.snapserve.ai/docs/webhooks -->

# Event subscriptions

Copy page
Workspace-wide: SnapServe POSTs call results to your HTTPS URL when a conversation finishes — transcript, summary, cost, and more.

Four different “webhook” jobs

- **Event subscriptions** (this page / Developers) — SnapServe → your app for every call
- **Post-call notify** — Agent Builder → Settings → one agent’s CRM URL after its calls
- **Form intake** — Connections / Campaigns → website form → SnapServe → dial
- **Lead transfer** — Campaign Configuration → push hot leads to CRM URL / Sheets

Dashboard: [Developers → Event subscriptions](https://app.snapserve.ai/app/api-keys?tab=webhooks).
## Events

| Event | When |
| call.completed | Call finished (normal path). Prefer this in new subscriptions. |
| call.failed | Call ended with a failed status |
| call.ended | Legacy alias — still matched when we send call.completed |

POST
## Register endpoint

[Full schema](/docs/api-reference/createWebhookEndpoint)`POST https://app.snapserve.ai/api/webhook-endpoints`

| Parameter | Type | Description |
| `url`required | string | Your HTTPS URL that accepts POST |
| `events`required | string[] | e.g. ["call.completed", "call.failed"] |

bashCopy
```
`curl -X POST https://app.snapserve.ai/api/webhook-endpoints \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.example.com/hooks/snapserve",
    "events": ["call.completed", "call.failed"]
  }'`
```

Save the secret

The create response includes `secret` once. It is masked as `secretHint` afterward. Copy it immediately.

GET
## List endpoints

[Full schema](/docs/api-reference/listWebhookEndpoints)`GET https://app.snapserve.ai/api/webhook-endpoints`

bashCopy
```
`curl https://app.snapserve.ai/api/webhook-endpoints \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY"`
```

## Delivery

- HTTP **POST** JSON body
- Respond **200** within ~10 seconds
- Failed deliveries are logged; keep your endpoint reliable

## Verify signatures

httpCopy
```
`X-SnapServe-Signature: sha256=<hmac-hex-digest>
X-SnapServe-Timestamp: 1718612345`
```

HMAC-SHA256 of `{timestamp}.{rawBody}` using your endpoint secret:

javascriptCopy
```
`import crypto from "crypto";

export function verifyWebhook(rawBody, signature, timestamp, secret) {
  const payload = `${timestamp}.${rawBody}`;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (!signature || signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}`
```

## Example payload

jsonCopy
```
`{
  "event": "call.completed",
  "timestamp": "2026-07-15T12:00:00.000Z",
  "data": {
    "callId": 2920,
    "agentId": 36,
    "status": "completed",
    "toNumber": "+916383653279",
    "fromNumber": "+917971543255",
    "durationSeconds": 84,
    "costCents": 700,
    "transcript": "Agent: Hello…",
    "callSummary": "Caller asked about pricing…",
    "dispositionResult": null,
    "recordingUrl": null
  }
}`
```

`costCents` is paise. You can also load the full record with [GET /calls/{id}](/docs/api-reference/getCall).

## Local development

Tunnel your laptop (ngrok / Cloudflare Tunnel) to an HTTPS URL SnapServe can reach.