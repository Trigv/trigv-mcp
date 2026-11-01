#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTrigvMcpServer } from './server.js';

async function main(): Promise<void> {
  const server = createTrigvMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Trigv MCP server running on stdio');
}

/**
 * True when this file is the program entry. `process.argv[1]` is the path the user ran,
 * which is a symlink when started through `npx` or `node_modules/.bin`, so resolve it first.
 */
export function isMainModule(argv1: string | undefined, moduleUrl: string): boolean {
  if (!argv1) {
    return false;
  }
  try {
    return realpathSync(argv1) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}

if (isMainModule(process.argv[1], import.meta.url)) {
  main().catch((error: unknown) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
