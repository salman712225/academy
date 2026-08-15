<!-- Source: https://app.snapserve.ai/docs/wallet -->

# Wallet

Copy page
Prepaid INR balance. Amounts in *Cents fields are paise (1 INR = 100 paise).

Platform fee is flat **₹5 / minute**. Top-ups are card-only (+18% GST) in the dashboard — most apps only read balance.

GET
## Get balance

[Full schema](/docs/api-reference/getWallet)`GET https://app.snapserve.ai/api/wallet`

bashCopy
```
`curl https://app.snapserve.ai/api/wallet \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY"`
```

jsonCopy
```
`{
  "balanceCents": 50000,
  "balanceInr": 500,
  "currency": "INR",
  "freeCreditsGranted": true
}`
```

`50000` paise = **₹500.00** (~100 minutes at ₹5/min).

## Transactions

bashCopy
```
`curl "https://app.snapserve.ai/api/wallet/transactions?limit=50" \
  -H "Authorization: Bearer $SNAPSERVE_API_KEY"`
```

## Top-ups

Operators add funds in the SnapServe dashboard with **card** checkout (Razorpay). Payable = wallet credit + **18% GST**.

## Insufficient funds

Outbound dials may fail with `402` when balance is too low. Prompt the account owner to top up. See [Errors](/docs/errors).