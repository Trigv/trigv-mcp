#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTrigvMcpServer } from './server.js';

async function main(): Promise<void> {
  const server = createTrigvMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Trigv MCP server running on stdio');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
