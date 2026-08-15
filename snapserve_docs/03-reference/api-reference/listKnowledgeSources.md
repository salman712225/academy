<!-- Source: https://app.snapserve.ai/docs/api-reference/listKnowledgeSources -->

# List all knowledge sources for the current user

GET`https://app.snapserve.ai/api/knowledge-sources`Try it

## Authorizations

`Authorization`string · headerrequired
Bearer authentication. Provide your session token as Authorization: Bearer <token>.

## Responses

200

List of knowledge sources

Array of `KnowledgeSource`

`id`integerrequired

`name`stringrequired

`type`enumrequired
Allowed: "faq", "text", "website", "file"

`status`enumrequired
Lifecycle statuses: validating (URL checks, website only), processing (ingesting), crawling (multi-page fetch, website only), ready (fully indexed), partial (website partially indexed), failed (ingestion error). Legacy values: active (= ready), error (= failed) — kept for backward compat with older rows.

Allowed: "validating", "processing", "crawling", "ready", "partial", "failed", "active", "error"

`entryCount`integerrequired

`createdAt`string · date-timerequired

`updatedAt`string · date-timerequired

#### On this page

- [Authorizations](#authorizations)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/knowledge-sources' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200Copy
```
`[
  {
    "id": 0,
    "name": "string",
    "type": "faq",
    "status": "validating",
    "entryCount": 0,
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
  --url 'https://app.snapserve.ai/api/knowledge-sources' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200Copy
```
`[
  {
    "id": 0,
    "name": "string",
    "type": "faq",
    "status": "validating",
    "entryCount": 0,
    "createdAt": "2026-06-25T09:30:00.000Z",
    "updatedAt": "2026-06-25T09:30:00.000Z"
  }
]`
```