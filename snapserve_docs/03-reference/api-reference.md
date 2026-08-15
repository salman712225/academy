<!-- Source: https://app.snapserve.ai/docs/api-reference -->

# SnapServe API

Public builder API only: agents, calls (transcript & summary), variables, webhooks, phone numbers, wallet, and knowledge base. 36 endpoints — campaigns, onboarding, CRM, providers, and other dashboard-internal APIs are not listed here.

Base URL`https://app.snapserve.ai/api`

## Introduction

Every endpoint accepts and returns JSON. Requests are made over HTTPS to the base URL above. Use the sidebar to browse endpoints by resource, or jump straight to a specific operation to see its parameters, request body, responses and a ready-to-run cURL example.

## Authentication

Use a developer API key from [Authentication](/docs/authentication) in the `Authorization` header:

```
`Authorization: Bearer sk_live_…`
```

Dashboard session JWTs work for the browser app only. Prefer `sk_live_` keys from your backend.

## Pagination

List endpoints that can return large collections accept `page` and `limit` query parameters where applicable. Check each endpoint's Query Parameters section for the exact pagination it supports.

## Rate Limiting

Requests are subject to fair-use rate limiting. If you exceed the allowed rate you will receive a `429 Too Many Requests` response; retry after a short backoff.

## Errors

SnapServe uses conventional HTTP status codes. `2xx` indicates success, `4xx` indicates a client error (missing or invalid parameters, authentication failures), and `5xx` indicates a server error. Error responses include a JSON body describing what went wrong.

## Resources

[Agents6
GETPOSTPATCHDEL](/docs/api-reference/listAgents)[Calls6
GETPOSTPATCH](/docs/api-reference/listCalls)[Meetings9
POSTGETDEL](/docs/api-reference/createMeetBot)[Variables4
GETPOSTPATCHDEL](/docs/api-reference/listAgentVariables)[Event subscriptions4
GETPOSTPATCHDEL](/docs/api-reference/listWebhookEndpoints)[Phone Numbers2
GETPATCH](/docs/api-reference/listPhoneNumbers)[Wallet2
GET](/docs/api-reference/getWallet)[Knowledge Base3
GETPOST](/docs/api-reference/listKnowledgeSources)