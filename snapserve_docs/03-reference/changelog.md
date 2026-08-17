<!-- Source: https://app.snapserve.ai/docs/changelog -->

# Changelog

Notable documentation and API-consumer changes.

## 2026-08-10 — Rename the four “webhook” surfaces

- **Event subscriptions** — Developers (was “Webhooks”)
- **Post-call notify** — Agent Settings (was “Webhooks” / CRM webhook)
- **Form intake** — Campaigns / Connections website (was “form webhook”)
- **Lead transfer** — Campaign push to CRM URL / Sheets (label clarified)
- **Mid-call HTTP** — Agent Tools custom function

## 2026-08-10 — Analytics inside Agent Builder

- Agent Builder top-level **Analytics** tab — call volume, success, spend, latency for that agent (same data as `/app/analytics/agents/:id`).
- Settings → former Analytics sub-tab is **Post-call notify** (CRM URL for that agent).

## 2026-08-10 — Analytics in primary nav

- Platform **Analytics** moved from sidebar More into the primary nav (with History).

## 2026-08-10 — Outcomes tab & naming clarity

- Agent Builder: top-level **Outcomes** tab (taxonomy + after-call messages) — no longer buried under Settings → Analytics.
- Naming: Bookings calendar vs Meeting bots; mid-call WhatsApp (Tools) vs after-call (Outcomes); display name ≠ spoken brand callout on Prompt.
- Squads: edit members in-app; Callback disposition ≠ live handoff callout.

## 2026-08-10 — Product clarity, meetings, playbook

- **Platform concepts** — agent vs campaign vs Connections vs Outcomes / after-call messages vs lead transfer vs squads vs meetings.
- **Meetings guide** — paste link, calendar Join, booking dispatch, in-meeting tools; API Reference tag **Meetings**.
- **Agents / Campaigns guides** — Outcomes + after-call on agent; lead transfer on campaign.
- **Voiceathon playbook** — rewritten for Connections hub, disposition dynamics, meetings, and current nav (see repo `docs/voiceathon-participant-playbook.md`).

## 2026-07-30 — Claude skill & MCP

- **Docs** — new guide [Claude skill & MCP](/docs/claude-skill) for Claude Desktop / Claude Code (agents, campaigns, website webhooks, and more via live tools).
- **MCP** — `@snapserve/mcp` (`lib/snapserve-mcp`) with`SNAPSERVE_API_KEY` against `https://app.snapserve.ai/api`.

## 2026-07-15 — Docs restructure

- **Learning guides** — what you can build, platform concepts, agents builder, variables, knowledge base, calendar, campaigns, FAQ.
- **Curated API Reference** — Bolna-style public surface only (agents, calls / transcript+summary, variables, webhooks, phones, wallet, knowledge, scheduling). Campaigns and admin APIs hidden from the sidebar.
- **API key auth** — `Bearer sk_live_…` on the public API.
- **INR billing** — ₹500 welcome, ₹5/min, phones ₹800+GST, card only.