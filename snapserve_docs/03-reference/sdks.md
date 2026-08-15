<!-- Source: https://app.snapserve.ai/docs/sdks -->

# API Wrappers & SDKs

Copy page
Zero-dependency REST API wrappers for Node.js/TypeScript, Python, and Go. Copy and paste directly into your project to start making calls in seconds.

## Official npm SDK

The official Node.js/TypeScript SDK is published on npm — typed helpers for agents, calls, phone numbers, analytics, webhooks, wallet and scheduling:

bashCopy
```
`npm install @snapserveai/sdk`
```

typescriptCopy
```
`import { SnapServe } from "@snapserveai/sdk";

const snapserve = new SnapServe({ apiKey: process.env.SNAPSERVE_API_KEY! });

const agents = await snapserve.agents.list();
const call = await snapserve.calls.createOutbound({
  agentId: agents[0].id,
  toNumber: "+919812345678",
});`
```

## MCP Server — use SnapServe from Claude, Cursor & other AI tools

The official MCP (Model Context Protocol) server lets AI assistants manage your SnapServe account in plain English — list agents, place calls, read transcripts, check analytics and wallet balance.

### Hosted remote MCP (Claude custom connectors)

Use this URL in Claude → Customize → Connectors → Add custom connector (name `snapserve`):

textCopy
```
`https://app.snapserve.ai/api/mcp`
```

Click **Connect**, then paste a Dashboard → API Keys `sk_live_…` key on the SnapServe authorize page. Or, if your Claude plan shows Request headers, set `authorization` to `Bearer sk_live_…`.

bashCopy
```
`claude mcp add snapserve --transport http \
  --url https://app.snapserve.ai/api/mcp \
  --header "Authorization: Bearer sk_live_..."`
```

### Local stdio (Claude Desktop / Cursor)

Requires Node.js on your machine:

jsonCopy
```
`{
  "mcpServers": {
    "snapserve": {
      "command": "npx",
      "args": ["-y", "@snapserveai/mcp"],
      "env": { "SNAPSERVE_API_KEY": "sk_live_..." }
    }
  }
}`
```

Add this to `claude_desktop_config.json` (Claude Desktop → Settings → Developer → Edit Config) or your MCP client's config, restart the app, and just ask: *"List my SnapServe agents"* or *"Call +91… with my sales agent"*. A ready-made Claude **skill** (for Claude Code / claude.ai) is also available at [github.com/srundme/snapserve-claude-skill](https://github.com/srundme/snapserve-claude-skill).

## Zero-dependency wrappers

Zero Dependencies

Prefer not to add a package? These production-grade client wrappers use native environment features (Node `fetch`, Python `urllib`, Go `net/http`). You can copy them directly into your codebase without installing external package dependencies.
## 1. TypeScript / JavaScript (Node.js 18+, Bun, Deno)

Save as `snapserve.ts` in your project:

typescriptCopy
```
`/**
 * SnapServe API Client Wrapper
 * Zero dependencies (requires Node 18+ fetch)
 */
export class SnapServeClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(opts?: { apiKey?: string; baseUrl?: string }) {
    this.apiKey = opts?.apiKey || process.env.SNAPSERVE_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("SNAPSERVE_API_KEY is required");
    }
    this.baseUrl = (opts?.baseUrl || "https://app.snapserve.ai/api").replace(/\/$/, "");
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `SnapServe API Error [${res.status}]`);
    }
    return data as T;
  }

  // ── Agents ──
  async listAgents() {
    return this.request<any[]>("GET", "/agents");
  }

  async getAgent(agentId: number) {
    return this.request<any>("GET", `/agents/${agentId}`);
  }

  // ── Outbound Calls ──
  async initiateOutboundCall(payload: { agentId: number; toNumber: string; variables?: Record<string, any> }) {
    return this.request<{ id: number; status: string; agentId: number; toNumber: string }>("POST", "/calls/outbound", payload);
  }

  async getCall(callId: number) {
    return this.request<any>("GET", `/calls/${callId}`);
  }

  // ── Webhooks ──
  async listWebhookEndpoints() {
    return this.request<any[]>("GET", "/webhook-endpoints");
  }

  async createWebhookEndpoint(payload: { url: string; events: string[] }) {
    return this.request<{ id: number; url: string; secret: string }>("POST", "/webhook-endpoints", payload);
  }

  // ── Wallet & Account ──
  async getWallet() {
    return this.request<{ balance: number }>("GET", "/wallet");
  }
}

// ── Example Usage ──
/*
const client = new SnapServeClient({ apiKey: "sk_live_YOUR_KEY" });
const agents = await client.listAgents();
const call = await client.initiateOutboundCall({
  agentId: agents[0].id,
  toNumber: "+919876543210",
  variables: { customer_name: "Karthik" }
});
console.log("Call initiated:", call.id);
*/`
```

## 2. Python (Python 3.8+)

Save as `snapserve.py` in your project:

pythonCopy
```
`"""
SnapServe API Client Wrapper (Python)
Zero dependencies — uses Python standard library.
"""
import json
import os
import urllib.request
import urllib.error

class SnapServeClient:
    def __init__(self, api_key: str = None, base_url: str = "https://app.snapserve.ai/api"):
        self.api_key = api_key or os.environ.get("SNAPSERVE_API_KEY")
        if not self.api_key:
            raise ValueError("SNAPSERVE_API_KEY is required")
        self.base_url = base_url.rstrip("/")

    def _request(self, method: str, path: str, payload: dict = None):
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = json.dumps(payload).encode("utf-8") if payload else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            raise RuntimeError(f"SnapServe API Error [{e.code}]: {err_body}")

    def list_agents(self):
        return self._request("GET", "/agents")

    def get_agent(self, agent_id: int):
        return self._request("GET", f"/agents/{agent_id}")

    def initiate_outbound_call(self, agent_id: int, to_number: str, variables: dict = None):
        payload = {"agentId": agent_id, "toNumber": to_number}
        if variables:
            payload["variables"] = variables
        return self._request("POST", "/calls/outbound", payload)

    def get_call(self, call_id: int):
        return self._request("GET", f"/calls/{call_id}")

    def get_wallet(self):
        return self._request("GET", "/wallet")

# ── Example Usage ──
# client = SnapServeClient(api_key="sk_live_YOUR_KEY")
# agents = client.list_agents()
# call = client.initiate_outbound_call(agent_id=agents[0]["id"], to_number="+919876543210")
# print("Call ID:", call["id"])`
```

## 3. Go Native Client

Save as `snapserve.go` in your project:

goCopy
```
`package snapserve

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		BaseURL:    "https://app.snapserve.ai/api",
		APIKey:     apiKey,
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) InitiateOutboundCall(agentID int, toNumber string, variables map[string]interface{}) (map[string]interface{}, error) {
	payload := map[string]interface{}{
		"agentId":  agentID,
		"toNumber": toNumber,
	}
	if variables != nil {
		payload["variables"] = variables
	}
	data, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", c.BaseURL+"/calls/outbound", bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("SnapServe API Error [%d]: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	json.Unmarshal(body, &result)
	return result, nil
}`
```

## OpenAPI Specification

For full endpoint schemas and interactive testing, explore the [API Reference](/docs/api-reference).

Prefer chatting with Claude instead of writing wrappers? See [Claude skill & MCP](/docs/claude-skill).