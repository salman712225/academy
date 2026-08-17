<!-- Source: https://app.snapserve.ai/docs/outbound-calls -->

# Calls & history

Place outbound calls, watch live status in the dashboard, and pull transcript / summary / disposition into your app.

## In the dashboard

[Calls](https://app.snapserve.ai/app/calls) lists every conversation — status, duration, cost, recording, transcript, and summary when available. Use filters to find failed or completed dials.

## Place a call (API)

bashCopy
```
`curl -X POST https://app.snapserve.ai/api/calls/outbound \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": 36,
    "toNumber": "+919876543210"
  }'`
```

Details: [initiateOutboundCall](/docs/api-reference/initiateOutboundCall).

## Transcript, summary & disposition

After completion, [GET /calls/{id}](/docs/api-reference/getCall) includes:

- `transcript` — full conversation text
- `callSummary` — short AI summary
- `successEvaluation` — outcome evaluation when enabled
- `dispositionResult` / disposition fields
- `costCents` — cost in paise · `durationSeconds`
- `recordingUrl` — when recording is available

bashCopy
```
`curl https://app.snapserve.ai/api/calls/2920 \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY"`
```

Prefer [webhooks](/docs/webhooks) (`call.completed`) over polling in production.
## More call APIs

- [List calls](/docs/api-reference/listCalls)
- [End live call](/docs/api-reference/endCall)
- [Set disposition](/docs/api-reference/updateCallDisposition)
- [Transfer](/docs/api-reference/transferCall)