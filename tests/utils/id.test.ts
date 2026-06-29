import { describe, it, expect } from 'vitest';
import { generateId } from '@/utils/id.ts';

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('returns a non-empty string', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns a UUID v4 format string', () => {
    const id = generateId();
    // UUID v4 pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBe(true);
  });

  it('generates unique IDs on each call', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('works without crypto.randomUUID (fallback path)', () => {
    // Save original
    const origCrypto = globalThis.crypto;

    // Remove crypto to force fallback
    // @ts-expect-error - deliberately removing crypto for test
    delete globalThis.crypto;

    try {
      const id = generateId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(id)).toBe(true);
    } finally {
      // Restore
      globalThis.crypto = origCrypto;
    }
  });
});
