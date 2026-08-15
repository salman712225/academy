<!-- Source: https://app.snapserve.ai/docs/agents -->

# Agents & builder

Create the voice persona in the dashboard, then drive it from your app with the Agents API.

## Build in the dashboard

1. Open [Agents](https://app.snapserve.ai/app/agents) → create or open an agent.
1. **Prompt** — instructions, language, and an explicit **Greeting message** (exact first line). Use [variables](/docs/variables) like `{{name}}`. The agent display name is an internal label — not automatically your company brand on the call.
1. **Voice** — speak / listen providers (or BYOP keys under Providers).
1. **Tools** — transfer, HTTP, booking ([calendar](/docs/calendar)), etc.
1. **Outcomes** (top-level Builder tab) — taxonomy, funnel meaning (Interested / Callback / DNC), data fields, and **after-call WhatsApp / email** rules. Wire channels under Connections first (or save rules and connect later). Mid-call WhatsApp is under Tools.
1. **Analytics** (top-level Builder tab) — this agent’s call volume, success rate, spend, and latency. Platform-wide funnel view stays at [/app/analytics](https://app.snapserve.ai/app/analytics).
1. **Knowledge** — attach a [knowledge base](/docs/knowledge-base).
1. **Phone** — assign a number for caller ID / inbound.
1. **Meetings** (optional) — meeting prompt + deck for Meet/Zoom/Teams. [Meetings guide](/docs/meetings).
1. **Save**, then toggle **Active** when ready.
1. Use Test / Publish flows in the builder before going live.

First agent: build in the UI. Day-to-day from your product: list / patch / toggle via API.
## Agents API

Full schemas and cURL in the API Reference:

- [List agents](/docs/api-reference/listAgents)
- [Create agent](/docs/api-reference/createAgent)
- [Get agent](/docs/api-reference/getAgent)
- [Update (save) agent](/docs/api-reference/updateAgent)
- [Toggle active](/docs/api-reference/toggleAgent)
- [Delete agent](/docs/api-reference/deleteAgent)

## Using on a call

Pass `agentId` to [POST /calls/outbound](/docs/api-reference/initiateOutboundCall). Wallet must cover ₹5/min. See [Calls & history](/docs/outbound-calls).