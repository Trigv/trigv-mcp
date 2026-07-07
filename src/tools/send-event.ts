import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TrigvClient } from '../client.js';
import { ConfigurationError } from '../errors.js';
import type { SendEventParams } from '../types.js';
import { formatErrorResult, formatSuccessResult } from '../response.js';
import { sendEventInputSchema, sendEventOutputSchema } from './schemas.js';

export interface SendEventToolOptions {
  apiKey?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export async function runSendEvent(
  args: SendEventParams,
  options: SendEventToolOptions = {},
): Promise<CallToolResult> {
  const apiKey = options.apiKey ?? process.env.TRIGV_API_KEY;

  try {
    const client = new TrigvClient({
      apiKey,
      baseUrl: options.baseUrl ?? process.env.TRIGV_BASE_URL,
      fetch: options.fetch,
    });

    const result = await client.sendEvent(args);
    return formatSuccessResult(result);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return formatErrorResult(error);
    }
    return formatErrorResult(error, apiKey?.trim());
  }
}

export function registerSendEventTool(server: McpServer, options: SendEventToolOptions = {}): void {
  server.registerTool(
    'send_event',
    {
      description:
        'Send a notification event to a Trigv workspace channel. Requires TRIGV_API_KEY.',
      inputSchema: sendEventInputSchema,
      outputSchema: sendEventOutputSchema,
    },
    async (args) => runSendEvent(args as SendEventParams, options),
  );
}
