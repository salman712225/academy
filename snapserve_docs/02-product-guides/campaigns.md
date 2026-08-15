<!-- Source: https://app.snapserve.ai/docs/campaigns -->

# Campaigns

Dashboard auto-dialer: upload leads, dial in batches, retry, and capture dispositions — no custom dialer required.

Building your own product? Prefer [outbound API calls](/docs/quick-start) + your CRM. Campaigns are best for in-house sales ops on SnapServe UI.
## Typical flow

1. Create a campaign from a source (CSV, Sheets, Website, Meta, CRM) and pick an active agent + phone number.
1. Map columns / fields to variables when uploading.
1. Start / activate; SnapServe paces concurrent dials from your wallet.
1. Review live queue, dispositions, callbacks, and recordings in the workspace.

## What campaigns own

- **Lead transfer** — Configuration tab: when disposition matches, push the lead to a webhook and/or Google Sheet.
- Dial queue, retries, calling hours, analytics slices (export / transfer / create batch).

WhatsApp / email after a call are configured on the **agent** (Builder → Outcomes → After-call messages), with channels under [Connections](https://app.snapserve.ai/app/connections). See [Platform concepts](/docs/platform-concepts).

## Compliance

Indian telephony may enforce quiet hours and KYC for numbers. Keep consent for outbound marketing dials. DNC lists can be managed in the campaign tools.

## API note

Campaign REST endpoints exist for advanced automation but are intentionally **not** featured in the public API Reference (too product-specific). Use the dashboard, or dial individually with [POST /calls/outbound](/docs/api-reference/initiateOutboundCall).