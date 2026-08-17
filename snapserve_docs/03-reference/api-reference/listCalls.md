<!-- Source: https://app.snapserve.ai/docs/api-reference/listCalls -->

# List calls with optional agent filter

GET`https://app.snapserve.ai/api/calls`Try it

## Authorizations

`Authorization`string · headerrequired
Bearer authentication. Provide your session token as Authorization: Bearer <token>.

## Query Parameters

`agentId`integer | nulloptional

`status`string | nulloptional

## Responses

200

List of calls

Array of `Call`

`id`integerrequired

`agentId`integerrequired

`agentName`stringrequired

`status`enumrequired
Allowed: "pending", "ringing", "in_progress", "connected", "completed", "failed", "cancelled", "transferred", "no_pickup", "voicemail", "busy", "booked", "callback_scheduled"

`toNumber`stringrequired

`fromNumber`stringrequired

`durationSeconds`integer | null

`transcript`string | null

`recordingUrl`string | null

`recordingEnabled`boolean | null
Whether the "Record Calls" toggle was enabled on the agent for this call

`recordingError`string | null
Reason the recording failed to finalize/upload when recording was enabled

`errorMessage`string | null

`metadata`string | null

`createdAt`string · date-timerequired

`endedAt`string · date-time | null

`sttLatencyMs`integer | null
Average STT round-trip latency across all turns (ms)

`llmLatencyMs`integer | null
Average LLM time-to-first-token across all turns (ms)

`ttsFirstChunkMs`integer | null
Average TTS time-to-first-audio-chunk across all turns (ms)

`executionId`string | null
Unique execution identifier for this call (exec_xxxxxxxx)

`costCents`integer | null
Platform orchestration fee charged for this call in cents

`callSummary`string | null
AI-generated 3-line post-call summary

`successEvaluation`string | null
Post-call LLM evaluation — PASS or FAIL on first line, one-sentence reason on the second line

`dispositionResult`object | null
Extracted disposition values keyed by field name

`tokensSaved`integer | null
Estimated number of input tokens saved by token optimization (sliding window + summarization)

`campaignId`integer | null
ID of the outbound campaign that placed this call, derived from the call_executions linkage. Null for manual/direct/web calls.

`direction`enum
Call direction derived server-side. Outbound for campaign calls, webcalls, and calls where metadata.direction=outbound; inbound otherwise.

Allowed: "inbound", "outbound"

#### On this page

- [Authorizations](#authorizations)
- [Query Parameters](#query-parameters)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/calls?agentId=0&status=string' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200Copy
```
`[
  {
    "id": 0,
    "agentId": 0,
    "agentName": "string",
    "status": "pending",
    "toNumber": "string",
    "fromNumber": "string",
    "durationSeconds": 0,
    "transcript": "string",
    "recordingUrl": "string",
    "recordingEnabled": true,
    "recordingError": "string",
    "errorMessage": "string",
    "metadata": "string",
    "createdAt": "2026-06-25T09:30:00.000Z",
    "endedAt": "2026-06-25T09:30:00.000Z",
    "sttLatencyMs": 0,
    "llmLatencyMs": 0,
    "ttsFirstChunkMs": 0,
    "executionId": "string",
    "costCents": 0,
    "callSummary": "string",
    "successEvaluation": "string",
    "dispositionResult": {
      "key": "string"
    },
    "tokensSaved": 0,
    "campaignId": 0,
    "direction": "inbound"
  }
]`
```

#### On this page

- [Authorizations](#authorizations)
- [Query Parameters](#query-parameters)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/calls?agentId=0&status=string' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200Copy
```
`[
  {
    "id": 0,
    "agentId": 0,
    "agentName": "string",
    "status": "pending",
    "toNumber": "string",
    "fromNumber": "string",
    "durationSeconds": 0,
    "transcript": "string",
    "recordingUrl": "string",
    "recordingEnabled": true,
    "recordingError": "string",
    "errorMessage": "string",
    "metadata": "string",
    "createdAt": "2026-06-25T09:30:00.000Z",
    "endedAt": "2026-06-25T09:30:00.000Z",
    "sttLatencyMs": 0,
    "llmLatencyMs": 0,
    "ttsFirstChunkMs": 0,
    "executionId": "string",
    "costCents": 0,
    "callSummary": "string",
    "successEvaluation": "string",
    "dispositionResult": {
      "key": "string"
    },
    "tokensSaved": 0,
    "campaignId": 0,
    "direction": "inbound"
  }
]`
```