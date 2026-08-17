<!-- Source: https://app.snapserve.ai/docs/api-reference/createMeetBot -->

# Launch a meeting bot into Meet / Zoom / Teams

POST`https://app.snapserve.ai/api/meet-bots`Try it
Sends the selected agent into a video meeting. Requires a logged-in session
(dashboard). Enable Meetings on the agent and set a meeting prompt first.

## Authorizations

`Authorization`string · headerrequired
Bearer authentication. Provide your session token as Authorization: Bearer <token>.

## Body application/json · required

`agentId`integerrequired
Agent configured for meetings

`meetingUrl`string · urirequired
Google Meet, Zoom, or Teams URL

`joinAsSelected`boolean
When true, skip booking delegate swap and join as agentId

## Responses

200400404503

Bot created

`botId`stringrequired

`status`stringrequired

`agentId`integerrequired

`configuredAgentId`integer

#### On this page

- [Authorizations](#authorizations)
- [Body](#body)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request POST \
  --url 'https://app.snapserve.ai/api/meet-bots' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "agentId": 0,
    "meetingUrl": "https://example.com",
    "joinAsSelected": true
  }'`
```

200400404503Copy
```
`{
  "botId": "string",
  "status": "string",
  "agentId": 0,
  "configuredAgentId": 0
}`
```

#### On this page

- [Authorizations](#authorizations)
- [Body](#body)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request POST \
  --url 'https://app.snapserve.ai/api/meet-bots' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "agentId": 0,
    "meetingUrl": "https://example.com",
    "joinAsSelected": true
  }'`
```

200400404503Copy
```
`{
  "botId": "string",
  "status": "string",
  "agentId": 0,
  "configuredAgentId": 0
}`
```