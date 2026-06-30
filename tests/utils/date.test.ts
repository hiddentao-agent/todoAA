import { describe, it, expect } from 'vitest';
import { getDueDateStatus, formatDate } from '@/utils/date.ts';

describe('getDueDateStatus', () => {
  it('returns null for null input', () => {
    expect(getDueDateStatus(null)).toBeNull();
  });

  it('returns overdue for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(getDueDateStatus(past)).toBe('overdue');
  });

  it('returns today for current date', () => {
    const today = new Date();
    expect(getDueDateStatus(today)).toBe('today');
  });

  it('returns tomorrow for next day', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(getDueDateStatus(tomorrow)).toBe('tomorrow');
  });

  it('returns upcoming for within 7 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(getDueDateStatus(future)).toBe('upcoming');
  });

  it('returns later for more than 7 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(getDueDateStatus(future)).toBe('later');
  });
});

describe('formatDate', () => {
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns formatted date string', () => {
    const result = formatDate('2026-06-29');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns empty string for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('returns formatted date for Date object', () => {
    const result = formatDate(new Date('2026-06-29'));
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
