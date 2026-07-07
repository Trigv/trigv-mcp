import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { VERSION } from './constants.js';
import { registerSendEventTool, type SendEventToolOptions } from './tools/send-event.js';

export type CreateServerOptions = SendEventToolOptions;

export function createTrigvMcpServer(options: CreateServerOptions = {}): McpServer {
  const server = new McpServer({
    name: 'trigv-mcp',
    version: VERSION,
  });

  registerSendEventTool(server, options);

  return server;
}
