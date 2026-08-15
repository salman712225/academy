<!-- Source: https://app.snapserve.ai/docs/platform-concepts -->

# Platform concepts

Who owns what — agents, campaigns, connections, dispositions, squads, and meetings.

Short rule: the **agent** owns the conversation and messages; the **campaign** owns the lead list and dial; **Connections** wires the outside world.
## Agent

A voice persona: system prompt, greeting, language, ASR/LLM/TTS (or BYOP), tools, knowledge base, phone number, variables, **Outcomes / dispositions**, **after-call WhatsApp & email rules**, and optional [meeting](/docs/meetings) settings. Configure in [Agents](https://app.snapserve.ai/app/agents). Toggle **active** before production calls.

## Campaign

Outbound dialing at scale: lead sources (CSV, Sheets, Website, Meta, CRM), queue, retries, calling hours, and **lead transfer** (push matching dispositions to a webhook or Google Sheet). Messaging after the call is configured on the **agent**, not the campaign. [Campaigns guide](/docs/campaigns).

## Connections

Hub for wires used by agents and campaigns: WhatsApp, Email (Brevo), Google Sheets, Website form, Meta Lead Ads, Calendar & booking, and Meetings entry. Open [Connections](https://app.snapserve.ai/app/connections).

## Disposition / Outcomes

After each call, AI picks an outcome from the agent’s taxonomy and fills data fields you define. Map labels to funnel meanings (Interested / Callback / DNC) for analytics. Set under Agent Builder → **Outcomes** (top-level tab).

## After-call messages

Agent-owned WhatsApp / email rules: every call, or only for matching dispositions. Requires live channels under Connections. Campaigns no longer map WA/email branches — they only **transfer leads**.

## Lead transfer

Campaign Configuration → when disposition matches, POST the lead to a webhook and/or append to a Google Sheet. Use this for CRM / ops handoff — not for customer messaging.

## Squad

Multi-agent team: mid-call live handoff (`transfer_to_*`) and follow-up tasks for a later outbound. Callback *disposition* means “call later”; it is not automatically a live handoff.

## Meeting

Same agent inside Google Meet / Zoom / Teams. Join via paste link, calendar Join toggles, or booking auto-dispatch. [Meetings guide](/docs/meetings).

## Call

One phone (or meeting) conversation. SnapServe stores status, duration, cost, transcript, summary, evaluation, and disposition. Retrieve with [GET /calls/{id}](/docs/api-reference/getCall) or listen on webhooks.

## Phone number

Caller ID outbound and DID inbound. India numbers need KYC. [Phone numbers guide](/docs/phone-numbers).

## Wallet

Prepaid INR balance. Usage deducts per minute. [Wallet](/docs/wallet).

## Variables

Placeholders like `{{customer_name}}` in the prompt, filled per call. [Variables](/docs/variables).

## Tools

Functions mid-conversation (book slot, transfer, HTTP webhook, meeting controls). Configured in the agent builder Tools tab.

## Knowledge base

Documents the agent can search during a call (RAG). [Knowledge base](/docs/knowledge-base).

## Event subscriptions & related URLs

Do not confuse these four jobs that all used to say “webhook”:

- **Event subscriptions** — Developers → workspace-wide call events. [Guide](/docs/webhooks).
- **Post-call notify** — Agent Builder → Settings → notify URL for that agent only.
- **Form intake** — Connections / Campaigns → website form POSTs leads into SnapServe.
- **Lead transfer** — Campaign Configuration → push matching dispositions to CRM / Sheets.

## API key

`sk_live_…` for server-to-server REST. Create under [API Keys](https://app.snapserve.ai/app/api-keys). [Authentication](/docs/authentication). Meeting bot launch typically uses a logged-in session (dashboard) — see [API Reference → Meetings](/docs/api-reference).