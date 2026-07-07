# @trigv/mcp

MCP (Model Context Protocol) server for [Trigv](https://trigv.com). Lets AI clients in Cursor, Claude Code, and VS Code send notification events to your Trigv workspace.

## What Trigv is

Trigv delivers developer notifications to your team's devices. Your backend (or AI agent) sends lightweight JSON events; Trigv queues push delivery. Notification title and body are not stored on Trigv servers — metadata only.

## Installation

```bash
npm install @trigv/mcp
```

Or run directly with `npx`:

```bash
npx @trigv/mcp
```

## Quick start

1. Create a workspace API key at [app.trigv.com](https://app.trigv.com).
2. Set `TRIGV_API_KEY` in your MCP client config (see below).
3. Ask your AI assistant to send an event using the `send_event` tool.

Example tool call:

```json
{
  "channel": "deploys",
  "title": "Production deploy complete",
  "description": "Build #42 succeeded in 38s (commit abc1234)",
  "level": "success",
  "event_type": "deploy.completed",
  "idempotency_key": "deploy-prod-42"
}
```

## Authentication

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `TRIGV_API_KEY` | Yes | — | Workspace ingest API key (`trgv_…`) |
| `TRIGV_BASE_URL` | No | `https://api.trigv.com/api` | Override for local dev (`http://trigv-platform.test/api`) |

The API key is sent as `Authorization: Bearer` and is **never** included in tool responses or error messages.

## Tool: `send_event`

Sends a notification event via `POST /v1/events`.

| Field | Required | Description |
|-------|:--------:|-------------|
| `channel` | Yes | Channel slug (e.g. `general`, `deploys`) |
| `title` | Yes | Notification title |
| `description` | No | Body text |
| `image_url` | No | HTTPS image URL (not stored server-side) |
| `level` | No | `info`, `success`, `warning`, `error` (default: `info`) |
| `delivery_urgency` | No | `standard` or `time_sensitive` (default: `standard`) |
| `event_type` | No | Free-form label (e.g. `deploy.completed`) |
| `idempotency_key` | No | Dedup key per workspace |

**Success response** includes `event.public_id`, `duplicate` (true when HTTP 200), and other event metadata.

**Error response** includes `error.type`, `error.message`, and optional `error.errors` for validation failures.

## Levels

- `info` — general information (default)
- `success` — completed successfully
- `warning` — attention needed
- `error` — failure or alert

## Delivery urgency

- `standard` — normal notifications (default)
- `time_sensitive` — iOS Time Sensitive delivery

## Idempotency

When you set `idempotency_key`, retries with the same key return the existing event (`duplicate: true`) without billing again.

## Error handling

| Error type | When |
|------------|------|
| `ConfigurationError` | Missing `TRIGV_API_KEY` |
| `ValidationError` | Invalid input (client or server 422) |
| `AuthenticationError` | HTTP 401 |
| `AuthorizationError` | HTTP 403 |
| `NotFoundError` | Channel not found (HTTP 404) |
| `RateLimitError` | HTTP 429 |
| `NetworkError` / `TimeoutError` | Connection issues |

## MCP client configuration

### Cursor

Add to `.cursor/mcp.json` in your project (or global Cursor MCP settings):

```json
{
  "mcpServers": {
    "trigv": {
      "command": "npx",
      "args": ["-y", "@trigv/mcp"],
      "env": {
        "TRIGV_API_KEY": "trgv_your_api_key_here"
      }
    }
  }
}
```

For a local checkout during development:

```json
{
  "mcpServers": {
    "trigv": {
      "command": "node",
      "args": ["/path/to/trigv-mcp/dist/index.js"],
      "env": {
        "TRIGV_API_KEY": "trgv_your_api_key_here",
        "TRIGV_BASE_URL": "http://trigv-platform.test/api"
      }
    }
  }
}
```

### Claude Code

Add to `~/.claude/settings.json` or project `.claude/settings.json`:

```json
{
  "mcpServers": {
    "trigv": {
      "command": "npx",
      "args": ["-y", "@trigv/mcp"],
      "env": {
        "TRIGV_API_KEY": "trgv_your_api_key_here"
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "trigv": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@trigv/mcp"],
      "env": {
        "TRIGV_API_KEY": "trgv_your_api_key_here"
      }
    }
  }
}
```

## Examples

### Basic event

```json
{ "channel": "general", "title": "Hello from MCP" }
```

### Deploy completed (canonical)

```json
{
  "channel": "deploys",
  "title": "Production deploy complete",
  "description": "Build #42 succeeded in 38s (commit abc1234)",
  "level": "success",
  "delivery_urgency": "standard",
  "event_type": "deploy.completed",
  "idempotency_key": "deploy-prod-42"
}
```

### Cron job failed

```json
{
  "channel": "alerts",
  "title": "Nightly backup failed",
  "description": "Exit code 1 after 12 minutes",
  "level": "error",
  "event_type": "cron.failed"
}
```

## Development

```bash
git clone https://github.com/Trigv/trigv-mcp.git
cd trigv-mcp
npm install
npm run build
npm test
```

Run locally:

```bash
TRIGV_API_KEY=trgv_… npm run dev
```

## Testing

```bash
npm test
```

Tests use mocked HTTP — no live API key required in CI.

## Contributing

See the [Trigv SDK programme](https://github.com/Trigv/trigv-node) for API contract and conformance requirements.

## Licence

MIT — see [LICENSE](LICENSE).
