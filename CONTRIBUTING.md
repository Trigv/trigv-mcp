# Contributing

## Development

```bash
npm install
npm test
npm run lint
npm run build
```

## Pull requests

1. Fork `Trigv/trigv-mcp` and branch from `main`
2. Run tests, lint, and build
3. Update `CHANGELOG.md` for user-visible changes

## API contract

Tool schemas must match [Trigv OpenAPI](https://api.trigv.com/openapi.yaml) ingest fields.

## Security

Never commit API keys. Never expose keys in MCP tool responses.
