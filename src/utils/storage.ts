/**
 * Storage quota estimation and persistent storage utilities.
 */

export interface StorageEstimate {
  usageBytes: number;
  quotaBytes: number;
  usagePercent: number;
}

export async function estimateStorage(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined' || typeof navigator.storage?.estimate !== 'function') {
    return { usageBytes: 0, quotaBytes: 0, usagePercent: 0 };
  }

  const estimate = await navigator.storage.estimate();
  const usageBytes = estimate.usage ?? 0;
  const quotaBytes = estimate.quota ?? 0;
  const usagePercent = quotaBytes > 0 ? Math.round((usageBytes / quotaBytes) * 100) : 0;

  return { usageBytes, quotaBytes, usagePercent };
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.storage?.persist !== 'function') {
    return false;
  }

  try {
    const granted = await navigator.storage.persist();
    return granted;
  } catch {
    return false;
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError';
  }
  if (error && typeof error === 'object' && 'name' in error) {
    return (error as DOMException).name === 'QuotaExceededError';
  }
  return false;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  const formatted = i === 0 ? value.toFixed(0) : value.toFixed(1);
  return `${formatted} ${units[i]}`;
}
