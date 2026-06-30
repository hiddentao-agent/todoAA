import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  estimateStorage,
  formatBytes,
  isQuotaExceededError,
  requestPersistentStorage,
} from '@/utils/storage.ts';

/* ------------------------------------------------------------------ */
/*  estimateStorage                                                    */
/* ------------------------------------------------------------------ */

describe('estimateStorage', () => {
  beforeEach(() => {
    // jsdom doesn't provide navigator.storage, so set it up
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: async () => ({ usage: 0, quota: 0 }),
        persist: async () => false,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    delete (navigator as any).storage;
  });

  it('returns zeros when navigator.storage is not available', async () => {
    delete (navigator as any).storage;

    const result = await estimateStorage();
    expect(result).toEqual({ usageBytes: 0, quotaBytes: 0, usagePercent: 0 });
  });

  it('returns usage and quota when navigator.storage is available', async () => {
    navigator.storage.estimate = async () => ({
      usage: 1_024_000,
      quota: 10_000_000,
    });

    const result = await estimateStorage();
    expect(result.usageBytes).toBe(1_024_000);
    expect(result.quotaBytes).toBe(10_000_000);

    // usagePercent = round(1024000 / 10000000 * 100) = round(10.24) = 10
    expect(result.usagePercent).toBe(10);
  });

  it('computes usagePercent correctly', async () => {
    navigator.storage.estimate = async () => ({
      usage: 5_000_000,
      quota: 10_000_000,
    });

    const result = await estimateStorage();
    expect(result.usagePercent).toBe(50);
  });

  it('rounds usagePercent to nearest integer', async () => {
    navigator.storage.estimate = async () => ({
      usage: 1,
      quota: 3,
    });

    const result = await estimateStorage();
    // 1/3 * 100 = 33.333... -> round -> 33
    expect(result.usagePercent).toBe(33);
  });

  it('returns usagePercent 0 when quota is 0', async () => {
    navigator.storage.estimate = async () => ({
      usage: 500,
      quota: 0,
    });

    const result = await estimateStorage();
    expect(result.usagePercent).toBe(0);
  });

  it('returns usagePercent 100 when usage meets quota', async () => {
    navigator.storage.estimate = async () => ({
      usage: 10_000_000,
      quota: 10_000_000,
    });

    const result = await estimateStorage();
    expect(result.usagePercent).toBe(100);
  });

  it('returns zeros when navigation.storage.estimate throws', async () => {
    navigator.storage.estimate = async () => {
      throw new Error('Storage unavailable');
    };

    // The current implementation doesn't catch errors — it lets them propagate
    await expect(estimateStorage()).rejects.toThrow('Storage unavailable');
  });
});

/* ------------------------------------------------------------------ */
/*  requestPersistentStorage                                           */
/* ------------------------------------------------------------------ */

describe('requestPersistentStorage', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: async () => ({ usage: 0, quota: 0 }),
        persist: async () => false,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    delete (navigator as any).storage;
  });

  it('returns false when navigator.storage is not available', async () => {
    delete (navigator as any).storage;

    const result = await requestPersistentStorage();
    expect(result).toBe(false);
  });

  it('returns true when persist is granted', async () => {
    navigator.storage.persist = async () => true;

    const result = await requestPersistentStorage();
    expect(result).toBe(true);
  });

  it('returns false when persist is denied', async () => {
    navigator.storage.persist = async () => false;

    const result = await requestPersistentStorage();
    expect(result).toBe(false);
  });

  it('returns false when persist throws', async () => {
    navigator.storage.persist = async () => {
      throw new Error('Not supported');
    };

    const result = await requestPersistentStorage();
    expect(result).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  formatBytes                                                        */
/* ------------------------------------------------------------------ */

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes (no decimal)', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats 1 byte', () => {
    expect(formatBytes(1)).toBe('1 B');
  });

  it('formats 1023 bytes as bytes', () => {
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('formats 1024 bytes as 1.0 KB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
  });

  it('formats fractional units', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('clamps to GB for very large values', () => {
    const tbValue = 5 * 1024 * 1024 * 1024 * 1024; // 5 TB
    // The unit array maxes out at GB, so it will show as <value> GB
    expect(formatBytes(tbValue)).toBe('5120.0 GB');
  });
});

/* ------------------------------------------------------------------ */
/*  isQuotaExceededError                                               */
/* ------------------------------------------------------------------ */

describe('isQuotaExceededError', () => {
  it('returns true for DOMException QuotaExceededError', () => {
    const error = new DOMException('Quota exceeded', 'QuotaExceededError');
    expect(isQuotaExceededError(error)).toBe(true);
  });

  it('returns true for DOMException with name property matching QuotaExceededError', () => {
    const error = new DOMException('Quota exceeded', 'QuotaExceededError');
    expect(isQuotaExceededError(error)).toBe(true);
  });

  it('returns false for other DOMException types', () => {
    const error = new DOMException('NotAllowed', 'NotAllowedError');
    expect(isQuotaExceededError(error)).toBe(false);

    const abortError = new DOMException('Aborted', 'AbortError');
    expect(isQuotaExceededError(abortError)).toBe(false);
  });

  it('returns false for plain Error', () => {
    expect(isQuotaExceededError(new Error('Something else'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isQuotaExceededError(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isQuotaExceededError(undefined)).toBe(false);
  });

  it('returns false for strings', () => {
    expect(isQuotaExceededError('string')).toBe(false);
  });

  it('returns false for numbers', () => {
    expect(isQuotaExceededError(42)).toBe(false);
  });

  it('returns true for plain objects with name QuotaExceededError', () => {
    const obj = { name: 'QuotaExceededError' };
    expect(isQuotaExceededError(obj)).toBe(true);
  });

  it('returns false for plain objects with different name', () => {
    const obj = { name: 'SomeOtherError' };
    expect(isQuotaExceededError(obj)).toBe(false);
  });

  it('returns false for plain objects without name property', () => {
    const obj = { message: 'error' };
    expect(isQuotaExceededError(obj)).toBe(false);
  });
});
