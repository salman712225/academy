<!-- Source: https://app.snapserve.ai/docs/api-reference/listAgentVariables -->

# List variable registry for an agent

GET`https://app.snapserve.ai/api/agents/{id}/variables`Try it

## Authorizations

`Authorization`string · headerrequired
Bearer authentication. Provide your session token as Authorization: Bearer <token>.

## Path Parameters

`id`integerrequired

## Responses

200401

Variable list

Array of `AgentVariable`

`id`integerrequired

`agentId`integerrequired

`variableName`stringrequired

`displayLabel`stringrequired

`isRequired`booleanrequired

`defaultValue`string | null

`dataType`enumrequired
Allowed: "string", "number", "date", "boolean"

`createdAt`string · date-timerequired

#### On this page

- [Authorizations](#authorizations)
- [Path Parameters](#path-parameters)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/agents/0/variables' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200401Copy
```
`[
  {
    "id": 0,
    "agentId": 0,
    "variableName": "string",
    "displayLabel": "string",
    "isRequired": true,
    "defaultValue": "string",
    "dataType": "string",
    "createdAt": "2026-06-25T09:30:00.000Z"
  }
]`
```

#### On this page

- [Authorizations](#authorizations)
- [Path Parameters](#path-parameters)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/agents/0/variables' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200401Copy
```
`[
  {
    "id": 0,
    "agentId": 0,
    "variableName": "string",
    "displayLabel": "string",
    "isRequired": true,
    "defaultValue": "string",
    "dataType": "string",
    "createdAt": "2026-06-25T09:30:00.000Z"
  }
]`
```