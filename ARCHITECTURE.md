# @trigv/mcp — Architecture

> **Scope:** MCP server exposing Trigv workspace ingest (`POST /v1/events`) to AI clients.  
> **API contract:** [OpenAPI](https://api.trigv.com/openapi.yaml) · [API reference](https://github.com/Trigv/platform/blob/main/_docs/trigv-api-reference.md)

---

## SDK choice

**Package:** [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (v1.x)

| Criterion | Decision |
|-----------|----------|
| Official MCP TypeScript SDK | Maintained by the Model Context Protocol org; matches Cursor, Claude Code, and VS Code MCP clients |
| High-level `McpServer` API | `registerTool` with Zod `inputSchema` / `outputSchema` — built-in `tools/list` and JSON-RPC wiring |
| Zod validation | SDK examples use `zod/v4`; tool input is validated before the handler runs (conformance M3) |
| No framework coupling | Stdio subprocess model fits local IDE integration without HTTP server setup |

**Not used:** `@trigv/sdk` as a runtime dependency. HTTP semantics are inlined to keep the MCP package self-contained and match `trigv-node` behaviour byte-for-byte (headers, retry policy, validation). Future refactors may depend on `@trigv/sdk` once both are published.

---

## Transport

**Stdio only** (`StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`).

```
┌─────────────┐   stdin/stdout (JSON-RPC)   ┌──────────────────┐
│ MCP client  │ ◄────────────────────────► │  @trigv/mcp      │
│ (Cursor,    │                             │  (Node process)  │
│  Claude,    │                             └────────┬─────────┘
│  VS Code)   │                                      │ HTTPS
└─────────────┘                                      ▼
                                            api.trigv.com/api/v1/events
```

- Client spawns `npx @trigv/mcp` or `node dist/index.js` as a child process.
- **stdout** is reserved for JSON-RPC — all logging uses **stderr** (`console.error`).
- No Streamable HTTP in v0.1.0 (local-only; remote hosting is out of scope).

---

## Process layout

| Module | Responsibility |
|--------|----------------|
| `src/index.ts` | CLI entry: create server, connect stdio transport |
| `src/server.ts` | `McpServer` factory, register tools |
| `src/tools/send-event.ts` | `send_event` handler: env check → validate → HTTP → format response |
| `src/tools/schemas.ts` | Zod input/output schemas matching API fields |
| `src/client.ts` | Inline HTTP client (same semantics as `trigv-node`) |
| `src/validation.ts` | Client-side validation before HTTP |
| `src/errors.ts` | Typed errors; no API key in messages |
| `src/response.ts` | Map success/errors to MCP `CallToolResult` |

---

## Tool design

### `send_event` (only tool)

**Purpose:** Send a notification event to a Trigv workspace channel.

**Input schema** — mirrors `IngestEventRequest` exactly (no invented fields):

| Field | Required | Type | Notes |
|-------|:--------:|------|-------|
| `channel` | Yes | string | Max 120; channel slug |
| `title` | Yes | string | Max 255 |
| `description` | No | string | Max 1000 |
| `image_url` | No | string | Max 2048 |
| `level` | No | enum | `info`, `success`, `warning`, `error` |
| `delivery_urgency` | No | enum | `standard`, `time_sensitive` |
| `event_type` | No | string | Max 120 |
| `idempotency_key` | No | string | Max 190 |

**Prohibited:** `api_key`, `icon`, and any unknown keys — rejected in handler validation (422-style) before HTTP.

**Authentication:** `TRIGV_API_KEY` environment variable (Bearer header). Optional `TRIGV_BASE_URL` (default `https://api.trigv.com/api`). Key is never returned in tool output or error text.

**Success response** (`structuredContent`):

```json
{
  "success": true,
  "duplicate": false,
  "event": {
    "public_id": "evt_…",
    "event_uuid": "…",
    "status": "queued",
    "level": "info",
    "event_type": null,
    "target_device_count": 2,
    "received_at": "2026-06-16T12:00:00+00:00"
  }
}
```

**Error response** (`isError: true`, `structuredContent`):

```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "channel is required",
    "errors": { "channel": ["channel is required"] }
  }
}
```

Error `type` values align with SDK spec: `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `RateLimitError`, `ApiError`, `NetworkError`, `TimeoutError`, `ConfigurationError` (missing API key).

### `tools/list`

Provided automatically by `McpServer` when tools are registered — no custom implementation.

---

## HTTP client (inline)

Matches `trigv-node` `src/client.ts`:

- `POST {base_url}/v1/events`
- Headers: `Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer …`, `User-Agent: trigv-mcp/0.1.0`
- Client-side validation via shared rules (trim, max lengths, enums, prohibited fields)
- Retry: max 2 retries, exponential backoff 0.5s / 1s + jitter; only when idempotency key set (or connection GET — not used here)
- Status mapping: 401 → AuthenticationError, 403 → AuthorizationError, 404 → NotFoundError, 422 → ValidationError, 429 → RateLimitError

---

## Security

- API key read once from `TRIGV_API_KEY` at tool invocation time.
- Redact key from all error strings and structured output.
- No persistence, no logging of request bodies containing secrets.

---

## Testing

- **Unit:** HTTP client with mocked `fetch` (same matrix as `trigv-node` tests).
- **Unit:** `send_event` tool handler — success, validation, missing key, auth error formatting.
- **CI:** lint, format, typecheck, test, build on Node 18/20/22.

No live API calls in CI.

---

## Out of scope (v0.1.0)

- `verify_connection` tool / `GET /v1/connection`
- Streamable HTTP / SSE transports
- Resources, prompts, sampling
- Publishing to npm (programme gate)
