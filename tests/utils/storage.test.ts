import { describe, it, expect } from 'vitest';
import { estimateStorage, formatBytes, isQuotaExceededError } from '@/utils/storage.ts';

describe('estimateStorage', () => {
  it('returns zeros when navigator.storage is not available', async () => {
    const result = await estimateStorage();
    expect(result).toEqual({ usageBytes: 0, quotaBytes: 0, usagePercent: 0 });
  });
});

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B');
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
});

describe('isQuotaExceededError', () => {
  it('returns true for DOMException QuotaExceededError', () => {
    const error = new DOMException('Quota exceeded', 'QuotaExceededError');
    expect(isQuotaExceededError(error)).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isQuotaExceededError(new Error('Something else'))).toBe(false);
    expect(isQuotaExceededError(null)).toBe(false);
    expect(isQuotaExceededError('string')).toBe(false);
  });
});
