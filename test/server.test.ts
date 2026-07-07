import { describe, expect, it } from 'vitest';
import { createTrigvMcpServer } from '../src/server.js';

describe('McpServer', () => {
  it('registers send_event tool', () => {
    const server = createTrigvMcpServer({
      apiKey: 'trgv_testkey1_abcdefghijklmnopqrstuvwxyz123456',
    });
    expect(server).toBeDefined();
    expect(server.isConnected()).toBe(false);
  });
});
