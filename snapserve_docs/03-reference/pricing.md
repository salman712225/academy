<!-- Source: https://app.snapserve.ai/docs/pricing -->

# Pricing

Copy page
Prepaid INR only — no monthly subscription tiers. Top up a wallet (card) and usage deducts as calls run.

## Platform rates

| Item | Price |
| Welcome credit (new accounts) | ₹500 (no GST) |
| Voice orchestration | ₹5 / minute (flat) |
| Wallet top-up | Chosen credit + 18% GST (card) |
| Phone number monthly rental | 80-series ₹599 · 79-series ₹699 · others ₹659 (+18% GST) |
| Phone number first purchase | Monthly rental + ₹100 setup + 18% GST (card) |
| Phone number renewal (30 days) | Same price as purchase, from wallet |
| Minimum top-up credit | ₹100 |

## Minutes math

- ₹500 credit ≈ **100 minutes** at ₹5/min.
- ₹1,000 credit + GST: you pay ₹1,180; wallet gains ₹1,000 ≈ 200 minutes.

## Read rates from the API

`GET /billing/rates` returns per-minute rates in paise. Wallet helpers: [Wallet](/docs/wallet).

## Payments

Checkout is **card only** via Razorpay. Top-up and number purchase happen in the dashboard; your app reads balance/usage over the API.