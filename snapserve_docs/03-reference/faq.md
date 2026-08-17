<!-- Source: https://app.snapserve.ai/docs/faq -->

# FAQ

Short answers to the issues builders hit most often.

## Why did my outbound call fail with 401?

Missing or wrong key. Use `Authorization: Bearer sk_live_…` from [Authentication](/docs/authentication). Session JWTs are for the browser dashboard only.

## Agent is draft — can I still call?

The API may still dial draft agents, but for production toggle the agent to **active** in the builder so behavior is intentional and published.

## Where are transcript and summary?

On the call record: [GET /calls/{id}](/docs/api-reference/getCall) fields `transcript`, `callSummary`, `successEvaluation`, `dispositionResult`. Also delivered on `call.completed` webhooks when configured.

## How do I connect Google Calendar?

Dashboard → Connections → Bookings calendar → connect Google → link that calendar on the agent’s booking tools. Full steps: [Bookings calendar](/docs/calendar). To *join* Meet/Zoom/Teams as a bot, use Meeting bots ([Meetings guide](/docs/meetings)), not Bookings calendar.

## How do variables work?

Define names on the agent, use `{{name}}` in the prompt, map values from campaigns or your app. Guide: [Variables](/docs/variables).

## Why can’t I buy a phone number?

Complete **KYC**, pay by **card** (₹599–₹699/mo by series + ₹100 setup + 18% GST), and have wallet funds for renewals. See [Phone numbers](/docs/phone-numbers).

## What does costCents mean?

Paise (INR × 100). Example: `700` = ₹7.00. Platform rate is ₹5/min. [Pricing](/docs/pricing).

## UPI for top-up?

Not offered — card checkout via Razorpay only.

## How do I verify webhooks?

HMAC of `{timestamp}.{rawBody}` vs `X-SnapServe-Signature`. [Event subscriptions](/docs/webhooks).

## Can I use SnapServe from Claude?

Yes — install the SnapServe Claude skill + MCP with your `sk_live_…` key. Guide: [Claude skill & MCP](/docs/claude-skill).