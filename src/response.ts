import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import {
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  TrigvError,
  ValidationError,
} from './errors.js';
import type { SendEventResult } from './types.js';

export interface ToolSuccessPayload {
  success: true;
  duplicate: boolean;
  event: SendEventResult['event'];
}

export interface ToolErrorPayload {
  success: false;
  error: {
    type: string;
    message: string;
    errors?: Record<string, string[]>;
    status_code?: number;
    retryable?: boolean;
    retry_after_seconds?: number;
    request_id?: string;
  };
}

export type ToolResponsePayload = ToolSuccessPayload | ToolErrorPayload;

function redactSecrets(text: string, apiKey?: string): string {
  if (!apiKey) {
    return text;
  }
  return text.split(apiKey).join('[REDACTED]');
}

export function formatSuccessResult(result: SendEventResult): CallToolResult {
  const structuredContent: ToolSuccessPayload = {
    success: true,
    duplicate: result.duplicate,
    event: result.event,
  };

  const summary = result.duplicate
    ? `Event already exists (${result.event.public_id})`
    : `Event queued (${result.event.public_id})`;

  return {
    content: [{ type: 'text', text: summary }],
    structuredContent: structuredContent as unknown as Record<string, unknown>,
  };
}

export function formatErrorResult(error: unknown, apiKey?: string): CallToolResult {
  const structuredContent = buildErrorPayload(error, apiKey);
  const message = redactSecrets(structuredContent.error.message, apiKey);

  return {
    content: [
      {
        type: 'text',
        text: structuredContent.error.request_id
          ? `${structuredContent.error.type}: ${message} (request id ${structuredContent.error.request_id})`
          : `${structuredContent.error.type}: ${message}`,
      },
    ],
    structuredContent: structuredContent as unknown as Record<string, unknown>,
    isError: true,
  };
}

export function buildErrorPayload(error: unknown, apiKey?: string): ToolErrorPayload {
  if (error instanceof TrigvError) {
    const payload: ToolErrorPayload = {
      success: false,
      error: {
        type: error.name,
        message: redactSecrets(error.message, apiKey),
      },
    };

    if (error instanceof ValidationError && Object.keys(error.errors).length > 0) {
      payload.error.errors = error.errors;
    }
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      payload.error.status_code = error.statusCode;
    }
    if (
      error instanceof RateLimitError ||
      error instanceof ConflictError ||
      error instanceof ServiceUnavailableError
    ) {
      payload.error.retryable = true;
      if (error.retryAfterMs !== undefined) {
        payload.error.retry_after_seconds = Math.ceil(error.retryAfterMs / 1000);
      }
    }
    if (error.requestId) {
      payload.error.request_id = error.requestId;
    }

    return payload;
  }

  const message =
    error instanceof Error ? redactSecrets(error.message, apiKey) : 'An unexpected error occurred';

  return {
    success: false,
    error: {
      type: 'Error',
      message,
    },
  };
}
