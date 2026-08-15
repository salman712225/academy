<!-- Source: https://app.snapserve.ai/docs/phone-numbers -->

# Phone Numbers

Copy page
Caller ID for outbound and DID for inbound. Buy Indian numbers in the dashboard (card), then assign via API.

India pricing

Monthly rental by series: **80-series ₹599**, **79-series ₹699**,** others ₹659** — plus ₹100 setup and 18% GST (card on first purchase). Renews every 30 days at the same price from your wallet. KYC required before purchase.

GET
## List your numbers

[Full schema](/docs/api-reference/listPhoneNumbers)`GET https://app.snapserve.ai/api/phone-numbers`

bashCopy
```
`curl https://app.snapserve.ai/api/phone-numbers \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY"`
```

PATCH
## Assign to agent

[Full schema](/docs/api-reference/assignPhoneNumber)`PATCH https://app.snapserve.ai/api/phone-numbers/{id}/assign`

bashCopy
```
`curl -X PATCH https://app.snapserve.ai/api/phone-numbers/789/assign \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "agentId": 123 }'`
```

## Purchase via API

`GET /phone-numbers/available`, `POST /phone-numbers/purchase/initiate`, `POST /phone-numbers/purchase/confirm`. Most apps still run purchase in the UI (card + KYC), then automate assign via API.

DEL
## Release number

[Full schema](/docs/api-reference/releasePhoneNumber)`DELETE https://app.snapserve.ai/api/phone-numbers/{id}`

bashCopy
```
`curl -X DELETE https://app.snapserve.ai/api/phone-numbers/789 \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY"`
```

Next: [Outbound Calls](/docs/outbound-calls).