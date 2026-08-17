<!-- Source: https://app.snapserve.ai/docs/api-reference/listWebhookEndpoints -->

# List all webhook endpoints for the authenticated user

GET`https://app.snapserve.ai/api/webhook-endpoints`Try it

## Authorizations

`Authorization`string · headerrequired
Bearer authentication. Provide your session token as Authorization: Bearer <token>.

## Responses

200401

List of webhook endpoints

Array of `WebhookEndpoint`

`id`integerrequired

`url`string · urirequired

`events`enum[]required
Event types that trigger this webhook. Prefer call.completed (call.ended is a legacy alias).

`secretHint`string | null
Last 6 chars of the signing secret (masked)

`secret`string | null
Full signing secret — only present on create responses

`enabled`booleanrequired

`description`string | null

`createdAt`string · date-timerequired

#### On this page

- [Authorizations](#authorizations)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/webhook-endpoints' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200401Copy
```
`[
  {
    "id": 0,
    "url": "https://example.com",
    "events": [
      "call.started"
    ],
    "secretHint": "string",
    "secret": "string",
    "enabled": true,
    "description": "string",
    "createdAt": "2026-06-25T09:30:00.000Z"
  }
]`
```

#### On this page

- [Authorizations](#authorizations)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/webhook-endpoints' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200401Copy
```
`[
  {
    "id": 0,
    "url": "https://example.com",
    "events": [
      "call.started"
    ],
    "secretHint": "string",
    "secret": "string",
    "enabled": true,
    "description": "string",
    "createdAt": "2026-06-25T09:30:00.000Z"
  }
]`
```