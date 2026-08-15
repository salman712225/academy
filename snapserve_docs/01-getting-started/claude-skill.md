<!-- Source: https://app.snapserve.ai/docs/claude-skill -->

# Claude skill & MCP

Copy page
Use Claude (Desktop or Claude Code) with the SnapServe skill and MCP so you can create agents, run campaigns, link website forms, and manage your account in plain English — backed by live API tools for [app.snapserve.ai](https://app.snapserve.ai).

## Connect SnapServe over MCP

Drive your whole SnapServe account — agents, calls, campaigns, journeys, WhatsApp, analytics — as tools from Claude, Cursor, Windsurf, and any MCP-aware client. 67 tools, plus a skill that teaches the assistant how SnapServe works.

[Get API Key](https://app.snapserve.ai/app/api-keys)[Full setup guide](#install-mcp)
1. 1 · Get your API key

Generate an `sk_live_…` key from Dashboard → API Keys.
1. 2 · Add the SnapServe MCP server

Paste this into your client's MCP config and add your key.

jsonCopy
```
`{
  "mcpServers": {
    "snapserve": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/voiceorch/lib/snapserve-mcp/dist/index.js"],
      "env": {
        "SNAPSERVE_API_KEY": "sk_live_YOUR_KEY",
        "SNAPSERVE_BASE_URL": "https://app.snapserve.ai/api"
      }
    }
  }
}`
```
1. 3 · Verify the connection

Ask your assistant to run a SnapServe tool:

textCopy
```
`Using SnapServe, list my agents and show my wallet balance.`
```

## Available tools

Agents

Create, update, toggle and version voice agents in plain English.

list_agents · create_agent · get_agent · toggle_agent

Calls

Place outbound calls, end live calls, pull transcripts and execution logs.

outbound_call · get_call · get_call_logs · end_call

Campaigns & leads

Run outbound campaigns, batches, retries and website / Sheet lead intake.

list_campaigns · get_campaign · get_website_webhook

Journeys

Build multi-step outreach journeys and activate or pause them.

list_journeys · activate_journey · pause_journey

WhatsApp & email

Check channel status, connections and message templates.

get_whatsapp_channel · get_email_channel

Numbers & squads

Phone numbers, squads, webcall links and provider keys.

list_phone_numbers · list_squads · list_webcall_links

Analytics & wallet

Dashboards, per-agent analytics, dispositions and wallet balance.

get_analytics_dashboard · get_agent_analytics · get_wallet

Everything else

An escape hatch that can call any SnapServe REST endpoint directly.

snapserve_api · snapserve_help

Skill vs MCP

The **skill** teaches Claude *how* SnapServe works (workflows, safe defaults). The **MCP server** gives Claude *tools* that call your account with your `sk_live_…` key. Use both together for the best experience.
## What you can do in Claude

Once connected, ask Claude things like:

- “List my SnapServe agents”
- “Create an English Voiceathon agent with Sarvam STT”
- “Call +91… with agent 415”
- “Create a website lead campaign and give me the form webhook URL”
- “Show transcript and logs for call 4943”
- “What’s my wallet balance?”

Claude uses tools such as `list_agents`, `create_agent`, `outbound_call`, `get_website_webhook`, and `snapserve_api` for anything else on the API.

## Prerequisites

1. A SnapServe account on [app.snapserve.ai](https://app.snapserve.ai).
1. An API key from [Dashboard → API Keys](https://app.snapserve.ai/app/api-keys) (`sk_live_…`). See [Authentication](/docs/authentication).
1. Claude Desktop or Claude Code, plus Node.js 20+ if you run the MCP from this repo.

Keep sk_live_ secret

Put the key only in MCP `env` / your secret manager — never paste the full key into public chats or commit it to git.
## 1. Build the SnapServe MCP

The MCP package lives in the SnapServe open repo at `lib/snapserve-mcp` (`@snapserve/mcp`).

bashCopy
```
`git clone https://github.com/srundme/voiceorch.git
cd voiceorch
pnpm install
pnpm --filter @snapserve/mcp build
# binary: lib/snapserve-mcp/dist/index.js`
```

## 2. Claude Desktop

Edit Claude’s config file (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

jsonCopy
```
`{
  "mcpServers": {
    "snapserve": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/voiceorch/lib/snapserve-mcp/dist/index.js"],
      "env": {
        "SNAPSERVE_API_KEY": "sk_live_YOUR_KEY",
        "SNAPSERVE_BASE_URL": "https://app.snapserve.ai/api"
      }
    }
  }
}`
```

1. Replace the path and API key.
1. Fully quit and reopen Claude Desktop.
1. Confirm the SnapServe MCP appears under tools / connectors (wording varies by Claude version).

**Skill:** copy the folder `claude-skill/snapserve` (or `.claude/skills/snapserve` from the repo) into your Claude skills directory so Claude loads SnapServe workflows automatically. Restart Claude after copying.

## 3. Claude Code

bashCopy
```
`claude mcp add snapserve \
  --env SNAPSERVE_API_KEY=sk_live_YOUR_KEY \
  --env SNAPSERVE_BASE_URL=https://app.snapserve.ai/api \
  -- node /ABSOLUTE/PATH/TO/voiceorch/lib/snapserve-mcp/dist/index.js`
```

With the repo open, Claude Code can also use `.claude/skills/snapserve/SKILL.md` for product guidance.

## 4. Try it

In a new Claude chat:

textCopy
```
`Using SnapServe, list my agents and show my wallet balance.`
```

Then try a website intake flow:

textCopy
```
`Create a campaign named "Website leads" for agent <id>, then give me the
website webhook URL and a curl example to POST a test lead.`
```

Paste the returned URL into your form / Sheet / Zap. Live intake path:

bashCopy
```
`curl -X POST 'https://app.snapserve.ai/api/webhooks/lead/YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919876543210","name":"Test Lead"}'`
```

## Skill only (no MCP)

If you only install the skill, Claude can still guide you and draft `curl` / SDK calls using your key — but it cannot call SnapServe live until MCP is connected. Prefer MCP for create-agent / campaign / dial actions.

Manual REST wrappers: [API Wrappers & SDKs](/docs/sdks). Full public HTTP surface: [API Reference](/docs/api-reference).

## Safety

- Confirm before delete agent / campaign.
- Don’t invent transcripts — ask Claude to fetch call detail / logs.
- Phone purchase / KYC / Razorpay top-ups stay in the [dashboard](https://app.snapserve.ai/app) when checkout is required.

## Also works in Cursor

Same MCP binary. Copy `.cursor/mcp.json.example` → `.cursor/mcp.json` in the repo and set `SNAPSERVE_API_KEY`. Project skill: `.agents/skills/snapserve`.

Source of truth

User how-to in the repo: `claude-skill/snapserve/README.md`. Install details: `claude-skill/snapserve/references/install-mcp.md`. Workflows: `references/workflows.md`.