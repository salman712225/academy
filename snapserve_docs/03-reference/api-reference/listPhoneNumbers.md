<!-- Source: https://app.snapserve.ai/docs/api-reference/listPhoneNumbers -->

# List all phone numbers owned by the authenticated user

GET`https://app.snapserve.ai/api/phone-numbers`Try it

## Authorizations

`Authorization`string · headerrequired
Bearer authentication. Provide your session token as Authorization: Bearer <token>.

## Responses

200401

List of owned phone numbers

Array of `PhoneNumber`

`id`integerrequired

`userId`stringrequired

`number`stringrequired
E.164 phone number (e.g. +12125551234)

`countryCode`stringrequired
ISO 3166-1 alpha-2 (e.g. US, IN)

`region`string | null

`numberType`enumrequired
Allowed: "local", "toll_free", "mobile"

`vobizNumberId`string | null

`provider`enum
Where the number lives — 'vobiz' = platform-rented DID; 'plivo' = user's own Plivo number imported from their telephony key (free, BYO).

Allowed: "vobiz", "plivo"

`agentId`integer | null

`agentName`string | null

`partnerAssigned`boolean
True when the number is owned by the client's managing partner and assigned to one of the client's agents (read-only for the client).

`status`enumrequired
Allowed: "active", "released"

`purchasedAt`string · date-timerequired

`monthlyRateCents`integer
Monthly cost in paise (INR; from Vobiz, 0 = no recurring fee)

`renewalRateCents`integer
Recurring monthly renewal fee in paise (INR), charged from wallet balance on the purchase-date anniversary (30 days)

`renewalMode`enum
How renewals are funded — autopay uses a Razorpay card mandate to top up the wallet; wallet uses balance only (unpaid past grace → release).

Allowed: "autopay", "wallet"

`renewalGraceUntil`string · date-time | null
If set, the number will be auto-released after this time if renewal remains unpaid.

`nextRenewalAt`string · date-time | null
When the next renewal charge is due (30 days after purchasedAt/lastRenewalAt). Null once released.

`lastRenewalAt`string · date-time | null

`releasedAt`string · date-time | null

`createdAt`string · date-timerequired

#### On this page

- [Authorizations](#authorizations)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/phone-numbers' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200401Copy
```
`[
  {
    "id": 0,
    "userId": "string",
    "number": "string",
    "countryCode": "string",
    "region": "string",
    "numberType": "local",
    "vobizNumberId": "string",
    "provider": "vobiz",
    "agentId": 0,
    "agentName": "string",
    "partnerAssigned": true,
    "status": "active",
    "purchasedAt": "2026-06-25T09:30:00.000Z",
    "monthlyRateCents": 0,
    "renewalRateCents": 0,
    "renewalMode": "autopay",
    "renewalGraceUntil": "2026-06-25T09:30:00.000Z",
    "nextRenewalAt": "2026-06-25T09:30:00.000Z",
    "lastRenewalAt": "2026-06-25T09:30:00.000Z",
    "releasedAt": "2026-06-25T09:30:00.000Z",
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
  --url 'https://app.snapserve.ai/api/phone-numbers' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200401Copy
```
`[
  {
    "id": 0,
    "userId": "string",
    "number": "string",
    "countryCode": "string",
    "region": "string",
    "numberType": "local",
    "vobizNumberId": "string",
    "provider": "vobiz",
    "agentId": 0,
    "agentName": "string",
    "partnerAssigned": true,
    "status": "active",
    "purchasedAt": "2026-06-25T09:30:00.000Z",
    "monthlyRateCents": 0,
    "renewalRateCents": 0,
    "renewalMode": "autopay",
    "renewalGraceUntil": "2026-06-25T09:30:00.000Z",
    "nextRenewalAt": "2026-06-25T09:30:00.000Z",
    "lastRenewalAt": "2026-06-25T09:30:00.000Z",
    "releasedAt": "2026-06-25T09:30:00.000Z",
    "createdAt": "2026-06-25T09:30:00.000Z"
  }
]`
```