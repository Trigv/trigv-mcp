# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-11-01

### Changed

- Default API URL is now `https://api.trigv.com`; the path is `/v1/events`. A `TRIGV_BASE_URL` ending in `/api` keeps working.
- `public_id` values are 26 character ULIDs (no `evt_` prefix).
- Rate limit is 60 requests per minute per workspace.
- Invalid JSON bodies return 422.

### Added

- Typed 409 (`ConflictError`) and 503 (`ServiceUnavailableError`) errors, retried with `Retry-After` when `idempotency_key` is set.
- Tool errors include `request_id` (the `X-Request-ID` header) and `retry_after_seconds`.
- When `Retry-After` is longer than the request timeout, the original 409, 429 or 503 error is thrown at once instead of waiting.

### Removed

- Monthly event cap handling.

### Deprecated

- `RateLimitError.retryable` (always `true`) and `isMonthlyLimitMessage` (always `false`) are kept as deprecated aliases for compatibility. The old `RateLimitError(message, retryable, retryAfterMs)` argument order still works. Both will be removed in the next major version.

## [0.1.0] - 2026-07-07

### Added

- Initial release of `@trigv/mcp` MCP server (stdio transport)
- `send_event` tool matching Trigv ingest API fields
- `TRIGV_API_KEY` configuration; structured success and error responses
- Secret redaction in tool output
