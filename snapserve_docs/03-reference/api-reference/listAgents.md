<!-- Source: https://app.snapserve.ai/docs/api-reference/listAgents -->

# List all agents

GET`https://app.snapserve.ai/api/agents`Try it

## Authorizations

`Authorization`string · headerrequired
Bearer authentication. Provide your session token as Authorization: Bearer <token>.

## Responses

200

List of agents

Array of `Agent`

`id`integerrequired

`name`stringrequired

`agentMode`enum | null
managed = platform master keys; byop = user-supplied keys

Allowed: "managed", "byop", null

`agentType`enum | null
Allowed: "general", "lead_qualification", "customer_support", "appointment_booking", "survey", null

`description`string | null

`status`enumrequired
Allowed: "active", "inactive", "draft"

`asrProvider`stringrequired
ASR provider: deepgram, azure, whisper

`asrModel`string | null

`asrLanguage`string | null
Language code for the ASR provider (e.g. en, es, hi-IN)

`asrBackgroundDenoising`boolean | null
Filter background noise while the user is talking

`asrConfidenceThreshold`number | null
Transcripts below this confidence score (0–1) will be filtered out

`asrEndOfTurnConfidence`number | null
Confidence threshold (0.5–0.9) required to finish a turn (Deepgram)

`asrEndOfTurnTimeout`integer | null
Maximum time to wait (ms) after speech before finishing a turn

`asrKeyterms`string | null
Comma-separated keywords to boost transcription accuracy

`asrSmartEndpointing`enum | null
Smart endpointing mode for more accurate speech endpoint detection

Allowed: "off", "vapi", "livekit", null

`asrAutoFallback`boolean | null
Automatically pick a backup STT provider if the primary fails

`asrFallbackProviders`object[] | nullShow attributes
Ordered list of backup STT providers tried when the primary fails

`llmProvider`stringrequired
LLM provider: openai, deepseek, anthropic, mistral, cohere, qwen, groq, sarvam, ultravox, openrouter

`llmModel`string | null

`ttsProvider`stringrequired
TTS provider: elevenlabs, openai, aws_polly, azure, cartesia, deepgram

`ttsVoice`string | null

`ttsModel`string | null

`telephonyProvider`stringrequired
Telephony: twilio, plivo, vonage

`systemPrompt`stringrequired

`temperature`number | null

`maxDuration`integer | null
Max call duration in seconds

`greetingMessage`string | null
First thing the agent says when a call connects. If blank the LLM generates an opener.

`firstSpeaker`enum | null
Who speaks first when a call connects. "assistant" plays the greeting (or LLM opener); "user" keeps the agent silent until the caller speaks.

Allowed: "assistant", "user", null

`endCallPhrases`string | null
Comma-separated phrases that trigger hangup (e.g. "goodbye,bye,thanks for calling")

`silenceTimeoutSeconds`integer | null
Hang up automatically after this many seconds of caller silence

`language`string | null
Primary language code passed to ASR / TTS (e.g. en-US, es, fr, hi)

`backchannelingEnabled`boolean | null
Inject short acknowledgement phrases while the LLM is thinking

`backchannelingFrequency`number | null
Probability (0–1) of backchanneling on each turn

`webhookUrl`string | null
URL to POST a call summary JSON to when the call ends

`noiseCancellationEnabled`boolean | null
Request noise reduction from the ASR provider on every transcription call

`inactivityMessage`string | null
Message spoken to the caller before hanging up due to silence timeout

`knowledgeBaseId`integer | null
ID of an attached knowledge base for RAG context injection

`knowledgeSourceIds`integer[]
IDs of all attached knowledge sources (many-to-many)

`tools`AgentTool[] | nullShow attributes
List of tools (functions) the LLM can invoke during a call

`maxConcurrentCalls`integer | null
Per-agent concurrent call cap (null = use account limit)

`monthlySpendLimitCents`integer | null
Monthly spend cap in cents (null = no limit)

`dispositionSchema`DispositionField[] | nullShow attributes
User-defined fields to extract from each call via LLM

`agentConfig`object | null
Advanced per-tab configuration (LLM params, engine, call, inbound, WhatsApp, analytics)

`leadSourceType`string | null
Lead source platform (e.g. instagram)

`leadSourceToken`string | null
Masked hint of the lead source access token (last 4 chars)

`leadFields`string[] | null
Lead fields to capture per incoming lead (name, email, message)

`productDetails`string | null
Product or service details the agent should know when calling leads

`snapserveAgentId`string | null
SnapServe platform agent ID used to fetch executions from the SnapServe API

`contextWindowTurns`integer | null
Sliding-window context: only the last N turns are sent to the LLM (null = unlimited)

`tokenSummarizationEnabled`boolean | null
Auto-compress old turns into a summary block when history exceeds threshold

`tokenSummarizationThresholdTurns`integer | null
Number of turns after which summarization is triggered

`stagedPromptEnabled`boolean | null
Send only the active stage block + core identity instead of the full system prompt

`stagedPromptStages`object[] | nullShow attributes
Named prompt stages (each with name + content)

`stagedPromptCoreIdentity`string | null
Core identity block always included in staged-prompt mode

`inboundPhoneNumberId`integer | null
Phone number ID assigned for inbound routing to this agent

`outboundPhoneNumberId`integer | null
Phone number ID used as caller ID for outbound calls from this agent

`totalCalls`integer

`successfulCalls`integer

`avgDurationSeconds`integer | null

`avgSttLatencyMs`integer | null
Rolling average STT latency across all completed calls (ms)

`avgLlmLatencyMs`integer | null
Rolling average LLM first-token latency across all completed calls (ms)

`avgTtsFirstChunkMs`integer | null
Rolling average TTS first-audio-chunk latency across all completed calls (ms)

`createdAt`string · date-timerequired

`updatedAt`string · date-timerequired

#### On this page

- [Authorizations](#authorizations)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/agents' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200Copy
```
`[
  {
    "id": 0,
    "name": "string",
    "agentMode": "managed",
    "agentType": "general",
    "description": "string",
    "status": "active",
    "asrProvider": "string",
    "asrModel": "string",
    "asrLanguage": "string",
    "asrBackgroundDenoising": true,
    "asrConfidenceThreshold": 0,
    "asrEndOfTurnConfidence": 0,
    "asrEndOfTurnTimeout": 0,
    "asrKeyterms": "string",
    "asrSmartEndpointing": "off",
    "asrAutoFallback": true,
    "asrFallbackProviders": [
      {
        "provider": "string",
        "model": "string"
      }
    ],
    "llmProvider": "string",
    "llmModel": "string",
    "ttsProvider": "string",
    "ttsVoice": "string",
    "ttsModel": "string",
    "telephonyProvider": "string",
    "systemPrompt": "string",
    "temperature": 0,
    "maxDuration": 0,
    "greetingMessage": "string",
    "firstSpeaker": "assistant",
    "endCallPhrases": "string",
    "silenceTimeoutSeconds": 0,
    "language": "string",
    "backchannelingEnabled": true,
    "backchannelingFrequency": 0,
    "webhookUrl": "string",
    "noiseCancellationEnabled": true,
    "inactivityMessage": "string",
    "knowledgeBaseId": 0,
    "knowledgeSourceIds": [
      0
    ],
    "tools": [
      {
        "type": "call_transfer",
        "name": "string",
        "description": "string",
        "transferTo": "string",
        "warmHandoffMessage": "string",
        "transferMode": "cold",
        "summaryPrompt": "string",
        "url": "string",
        "method": "GET",
        "headers": {
          "key": "string"
        },
        "secret": "string",
        "parameters": {
          "type": "string",
          "properties": {
            "key": {
              "type": "string",
              "description": "string"
            }
          },
          "required": [
            "string"
          ]
        },
        "messageTemplate": "string",
        "goodbyeMessage": "string",
        "apiKey": "string",
        "eventTypeId": 0,
        "calendarId": 0,
        "timezone": "string",
        "taskName": "string",
        "preToolMessage": "string",
        "targetNumber": "string",
        "holdMessage": "string",
        "targetAgentId": 0
      }
    ],
    "maxConcurrentCalls": 0,
    "monthlySpendLimitCents": 0,
    "dispositionSchema": [
      {
        "key": "string",
        "label": "string",
        "type": "text",
        "options": [
          "string"
        ],
        "required": true
      }
    ],
    "agentConfig": {},
    "leadSourceType": "string",
    "leadSourceToken": "string",
    "leadFields": [
      "string"
    ],
    "productDetails": "string",
    "snapserveAgentId": "string",
    "contextWindowTurns": 0,
    "tokenSummarizationEnabled": true,
    "tokenSummarizationThresholdTurns": 0,
    "stagedPromptEnabled": true,
    "stagedPromptStages": [
      {
        "name": "string",
        "content": "string"
      }
    ],
    "stagedPromptCoreIdentity": "string",
    "inboundPhoneNumberId": 0,
    "outboundPhoneNumberId": 0,
    "totalCalls": 0,
    "successfulCalls": 0,
    "avgDurationSeconds": 0,
    "avgSttLatencyMs": 0,
    "avgLlmLatencyMs": 0,
    "avgTtsFirstChunkMs": 0,
    "createdAt": "2026-06-25T09:30:00.000Z",
    "updatedAt": "2026-06-25T09:30:00.000Z"
  }
]`
```

#### On this page

- [Authorizations](#authorizations)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/agents' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200Copy
```
`[
  {
    "id": 0,
    "name": "string",
    "agentMode": "managed",
    "agentType": "general",
    "description": "string",
    "status": "active",
    "asrProvider": "string",
    "asrModel": "string",
    "asrLanguage": "string",
    "asrBackgroundDenoising": true,
    "asrConfidenceThreshold": 0,
    "asrEndOfTurnConfidence": 0,
    "asrEndOfTurnTimeout": 0,
    "asrKeyterms": "string",
    "asrSmartEndpointing": "off",
    "asrAutoFallback": true,
    "asrFallbackProviders": [
      {
        "provider": "string",
        "model": "string"
      }
    ],
    "llmProvider": "string",
    "llmModel": "string",
    "ttsProvider": "string",
    "ttsVoice": "string",
    "ttsModel": "string",
    "telephonyProvider": "string",
    "systemPrompt": "string",
    "temperature": 0,
    "maxDuration": 0,
    "greetingMessage": "string",
    "firstSpeaker": "assistant",
    "endCallPhrases": "string",
    "silenceTimeoutSeconds": 0,
    "language": "string",
    "backchannelingEnabled": true,
    "backchannelingFrequency": 0,
    "webhookUrl": "string",
    "noiseCancellationEnabled": true,
    "inactivityMessage": "string",
    "knowledgeBaseId": 0,
    "knowledgeSourceIds": [
      0
    ],
    "tools": [
      {
        "type": "call_transfer",
        "name": "string",
        "description": "string",
        "transferTo": "string",
        "warmHandoffMessage": "string",
        "transferMode": "cold",
        "summaryPrompt": "string",
        "url": "string",
        "method": "GET",
        "headers": {
          "key": "string"
        },
        "secret": "string",
        "parameters": {
          "type": "string",
          "properties": {
            "key": {
              "type": "string",
              "description": "string"
            }
          },
          "required": [
            "string"
          ]
        },
        "messageTemplate": "string",
        "goodbyeMessage": "string",
        "apiKey": "string",
        "eventTypeId": 0,
        "calendarId": 0,
        "timezone": "string",
        "taskName": "string",
        "preToolMessage": "string",
        "targetNumber": "string",
        "holdMessage": "string",
        "targetAgentId": 0
      }
    ],
    "maxConcurrentCalls": 0,
    "monthlySpendLimitCents": 0,
    "dispositionSchema": [
      {
        "key": "string",
        "label": "string",
        "type": "text",
        "options": [
          "string"
        ],
        "required": true
      }
    ],
    "agentConfig": {},
    "leadSourceType": "string",
    "leadSourceToken": "string",
    "leadFields": [
      "string"
    ],
    "productDetails": "string",
    "snapserveAgentId": "string",
    "contextWindowTurns": 0,
    "tokenSummarizationEnabled": true,
    "tokenSummarizationThresholdTurns": 0,
    "stagedPromptEnabled": true,
    "stagedPromptStages": [
      {
        "name": "string",
        "content": "string"
      }
    ],
    "stagedPromptCoreIdentity": "string",
    "inboundPhoneNumberId": 0,
    "outboundPhoneNumberId": 0,
    "totalCalls": 0,
    "successfulCalls": 0,
    "avgDurationSeconds": 0,
    "avgSttLatencyMs": 0,
    "avgLlmLatencyMs": 0,
    "avgTtsFirstChunkMs": 0,
    "createdAt": "2026-06-25T09:30:00.000Z",
    "updatedAt": "2026-06-25T09:30:00.000Z"
  }
]`
```