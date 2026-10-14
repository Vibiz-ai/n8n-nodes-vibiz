# n8n-nodes-vibiz

This is an n8n community node for [Vibiz](https://www.vibiz.ai), the AI marketing team. Use it in workflows, or as a tool for n8n AI Agents, to read brand kits, make on-brand ad creatives and UGC videos, pull ad and social performance across Meta, Google, TikTok, LinkedIn, Pinterest and X, and get next-best marketing actions.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Example workflows](#example-workflows) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) and install `n8n-nodes-vibiz`.

## Operations

| Resource | Operations |
|---|---|
| Brand | List, Get Brand Kit, Get Recommendations, Onboard (from a website or Instagram URL) |
| Creative | List, Plan (shows the credit cost; nothing is spent), Create (spends Vibiz credits), Get Generation Status |
| Report | Get Growth Report (7, 30 or 90 days, all connected platforms) |
| Ad | Get Many Campaigns, Get Many Ads (with metrics, per platform) |
| Social | Get Many Accounts, Get Many Posts |
| Account | Get Credits and Plan, Who Am I |
| Tool | Call (advanced: call any Vibiz MCP tool by name with JSON arguments) |

Publishing posts, pausing ads and deleting are not exposed as operations: Vibiz requires a person to approve those in the Vibiz app or in a chat client with Vibiz approval cards.

The node is marked `usableAsTool`, so an n8n **AI Agent** can call it directly.

## Credentials

The node signs in with OAuth 2.0 (authorization code with PKCE) to the Vibiz account you choose.

1. In n8n, create a **Vibiz OAuth2 API** credential and copy its **OAuth Redirect URL**.
2. Get a client ID for that redirect URL:
   - Ask Vibiz support (https://www.vibiz.ai/support) for an n8n client ID, **or**
   - Register one yourself with dynamic client registration:

     ```bash
     curl -X POST https://secure-egg-74.authkit.app/oauth2/register \
       -H "Content-Type: application/json" \
       -d '{"client_name":"n8n","redirect_uris":["<your n8n OAuth Redirect URL>"],"grant_types":["authorization_code","refresh_token"],"response_types":["code"],"token_endpoint_auth_method":"none"}'
     ```

     Use the `client_id` from the response. Leave the client secret empty unless one is returned.
3. Paste the client ID, click **Connect my account**, sign in to Vibiz and allow access.

You need a Vibiz account. Ad and social data need those accounts connected in the Vibiz app.

## How it works

The node talks to the Vibiz remote MCP server at `https://mcp.vibiz.ai/mcp` over HTTPS (MCP Streamable HTTP, JSON-RPC). It has no runtime dependencies and sends data only to that server, using your OAuth token. What it sends: the parameters you set on the node (brand slug, briefs, filters).

## Example workflows

- **Weekly report to Slack:** Schedule Trigger (Monday 8am) → Vibiz *Report: Get Growth Report* → Slack. Starter file: [`examples/weekly-report-to-slack.json`](examples/weekly-report-to-slack.json).
- **Ads for every new product:** Shopify trigger (product created) → Vibiz *Creative: Plan* → IF affordable → Vibiz *Creative: Create*.
- **Marketing agent:** AI Agent with the Vibiz node as a tool: "Every morning, check yesterday's Meta ads and tell me which to pause."

## Compatibility

Tested with n8n 1.x and n8n-workflow 2.x. Requires Node.js 20+.

## Resources

- [Vibiz MCP docs](https://www.vibiz.ai/docs/mcp)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- Privacy policy: https://www.vibiz.ai/privacy

## License

[MIT](LICENSE.md)
