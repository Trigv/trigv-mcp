import { describe, expect, it, vi } from 'vitest';
import { runSendEvent } from '../src/tools/send-event.js';

const API_KEY = 'trgv_testkey1_abcdefghijklmnopqrstuvwxyz123456';

const sampleEvent = {
  public_id: '01JXXXXXXXXXXXXXXXXXXXXXXX',
  event_uuid: '550e8400-e29b-41d4-a716-446655440000',
  status: 'sent',
  level: 'success',
  event_type: 'deploy.completed',
  target_device_count: 2,
  received_at: '2026-06-16T12:00:00+00:00',
};

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    return handler(url, init);
  }) as typeof fetch;
}

describe('send_event tool', () => {
  it('returns structured success payload', async () => {
    const fetch = mockFetch(
      () => new Response(JSON.stringify({ event: sampleEvent }), { status: 202 }),
    );

    const result = await runSendEvent(
      { channel: 'deploys', title: 'Production deploy complete', level: 'success' },
      { apiKey: API_KEY, fetch, baseUrl: 'https://api.trigv.com' },
    );

    expect(result.isError).toBeUndefined();
    expect(result.structuredContent).toMatchObject({
      success: true,
      duplicate: false,
      event: { public_id: '01JXXXXXXXXXXXXXXXXXXXXXXX' },
    });
  });

  it('returns duplicate flag on HTTP 200', async () => {
    const fetch = mockFetch(
      () => new Response(JSON.stringify({ event: sampleEvent }), { status: 200 }),
    );

    const result = await runSendEvent(
      { channel: 'general', title: 'x', idempotency_key: 'retry-123' },
      { apiKey: API_KEY, fetch },
    );

    expect(result.structuredContent).toMatchObject({
      success: true,
      duplicate: true,
    });
  });

  it('returns configuration error when API key missing', async () => {
    const result = await runSendEvent(
      { channel: 'general', title: 'Hello' },
      { apiKey: '', fetch: mockFetch(() => new Response()) },
    );

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: false,
      error: {
        type: 'ConfigurationError',
        message: 'TRIGV_API_KEY is required',
      },
    });
    expect(JSON.stringify(result)).not.toContain('trgv_');
  });

  it('returns authentication error without exposing API key', async () => {
    const fetch = mockFetch(
      () => new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }),
    );

    const result = await runSendEvent(
      { channel: 'general', title: 'x' },
      { apiKey: API_KEY, fetch },
    );

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: false,
      error: {
        type: 'AuthenticationError',
        status_code: 401,
      },
    });
    expect(JSON.stringify(result)).not.toContain(API_KEY);
  });

  it('returns validation error for invalid level before HTTP', async () => {
    const fetch = mockFetch(() => new Response('{}', { status: 202 }));
    const result = await runSendEvent(
      { channel: 'general', title: 'x', level: 'meta' as 'info' },
      { apiKey: API_KEY, fetch },
    );

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: false,
      error: { type: 'ValidationError' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('forwards url when provided', async () => {
    const fetch = mockFetch((_url, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body.url).toBe('https://example.com/deployments/42');
      return new Response(JSON.stringify({ event: sampleEvent }), { status: 202 });
    });

    const result = await runSendEvent(
      {
        channel: 'deploys',
        title: 'Production deploy complete',
        url: 'https://example.com/deployments/42',
      },
      { apiKey: API_KEY, fetch },
    );

    expect(result.isError).toBeUndefined();
    expect(fetch).toHaveBeenCalled();
  });

  it('rejects overlength url before HTTP', async () => {
    const fetch = mockFetch(() => new Response('{}', { status: 202 }));
    const result = await runSendEvent(
      {
        channel: 'general',
        title: 'x',
        url: `https://example.com/${'a'.repeat(2040)}`,
      },
      { apiKey: API_KEY, fetch },
    );

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: false,
      error: { type: 'ValidationError' },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns request id, retry hint and status for a 409', async () => {
    const fetch = mockFetch(
      () =>
        new Response(JSON.stringify({ message: 'busy' }), {
          status: 409,
          headers: { 'Retry-After': '7', 'X-Request-ID': '01JREQXXXXXXXXXXXXXXXXXXXX' },
        }),
    );

    const result = await runSendEvent(
      { channel: 'general', title: 'x' },
      { apiKey: API_KEY, fetch },
    );

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: false,
      error: {
        type: 'ConflictError',
        status_code: 409,
        retryable: true,
        retry_after_seconds: 7,
        request_id: '01JREQXXXXXXXXXXXXXXXXXXXX',
      },
    });
  });

  it('returns a 503 error with retry hint', async () => {
    const fetch = mockFetch(
      () =>
        new Response(JSON.stringify({ message: 'down' }), {
          status: 503,
          headers: { 'Retry-After': '3' },
        }),
    );

    const result = await runSendEvent(
      { channel: 'general', title: 'x' },
      { apiKey: API_KEY, fetch },
    );

    expect(result.structuredContent).toMatchObject({
      error: { type: 'ServiceUnavailableError', retryable: true, retry_after_seconds: 3 },
    });
  });
});
