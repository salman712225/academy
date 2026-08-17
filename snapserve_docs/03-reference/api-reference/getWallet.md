<!-- Source: https://app.snapserve.ai/docs/api-reference/getWallet -->

# Get current user wallet balance and settings

GET`https://app.snapserve.ai/api/wallet`Try it

## Authorizations

`Authorization`string · headerrequired
Bearer authentication. Provide your session token as Authorization: Bearer <token>.

## Responses

200401

Wallet info

`balanceCents`integerrequired
Current balance in INR paise (1 INR = 100 paise). Field name is historical.

`balanceInr`number
Current balance in INR (rupees)

`balanceUsd`number
Deprecated alias of balanceInr (INR, not USD)

`currency`string
Always INR

`gstRate`number
GST rate applied on card top-ups (e.g. 0.18)

`freeCreditsGranted`booleanrequired

`autoPayEnabled`booleanrequired

`autoPayThresholdCents`integerrequired
Auto-pay threshold in paise

`autoPayAmountCents`integerrequired
Auto-pay credit amount in paise (payable includes GST)

`mandateActive`booleanrequired
Whether a Razorpay recurring card mandate token is saved for auto-pay

`effectiveRateCentsPerMin`integer
Per-minute rate (paise) this account is billed at — the partner-set rate for partner-managed clients, the base rate for a partner's own usage, and the flat platform rate otherwise. Drives "minutes left" estimates in the UI.

`minTopupPaise`integer
Minimum wallet top-up credit in paise. ₹5,000 (500000) for active partner owners; ₹100 (10000) for everyone else.

`minTopupInr`number
Minimum wallet top-up credit in INR (rupees)

#### On this page

- [Authorizations](#authorizations)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/wallet' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200401Copy
```
`{
  "balanceCents": 0,
  "balanceInr": 0,
  "balanceUsd": 0,
  "currency": "INR",
  "gstRate": 0,
  "freeCreditsGranted": true,
  "autoPayEnabled": true,
  "autoPayThresholdCents": 0,
  "autoPayAmountCents": 0,
  "mandateActive": true,
  "effectiveRateCentsPerMin": 0,
  "minTopupPaise": 0,
  "minTopupInr": 0
}`
```

#### On this page

- [Authorizations](#authorizations)
- [Responses](#responses)

RequestcURLCopy
```
`curl --request GET \
  --url 'https://app.snapserve.ai/api/wallet' \
  --header 'Authorization: Bearer sk_live_YOUR_API_KEY'`
```

200401Copy
```
`{
  "balanceCents": 0,
  "balanceInr": 0,
  "balanceUsd": 0,
  "currency": "INR",
  "gstRate": 0,
  "freeCreditsGranted": true,
  "autoPayEnabled": true,
  "autoPayThresholdCents": 0,
  "autoPayAmountCents": 0,
  "mandateActive": true,
  "effectiveRateCentsPerMin": 0,
  "minTopupPaise": 0,
  "minTopupInr": 0
}`
```