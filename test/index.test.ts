import { mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isMainModule } from '../src/index.js';

const indexPath = fileURLToPath(new URL('../src/index.ts', import.meta.url));

describe('isMainModule', () => {
  it('is true when started by its own path', () => {
    expect(isMainModule(indexPath, pathToFileURL(indexPath).href)).toBe(true);
  });

  it('is true when started through a symlink (npx, node_modules/.bin)', () => {
    const link = join(mkdtempSync(join(tmpdir(), 'trigv-mcp-')), 'trigv-mcp');
    symlinkSync(indexPath, link);
    expect(isMainModule(link, pathToFileURL(indexPath).href)).toBe(true);
  });

  it('is false for another file or no argument', () => {
    expect(isMainModule(fileURLToPath(import.meta.url), pathToFileURL(indexPath).href)).toBe(false);
    expect(isMainModule(undefined, pathToFileURL(indexPath).href)).toBe(false);
    expect(isMainModule('/does/not/exist', pathToFileURL(indexPath).href)).toBe(false);
  });
});
