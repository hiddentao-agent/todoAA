import { describe, it, expect } from 'vitest';
import { sanitizeString } from '@/utils/sanitize.ts';

describe('TaskFormPanel validation', () => {
  describe('title validation', () => {
    it('accepts valid titles', () => {
      const result = sanitizeString('Buy groceries');
      expect(result).toBe('Buy groceries');
    });

    it('trims whitespace', () => {
      const result = sanitizeString('  hello  ');
      expect(result).toBe('hello');
    });

    it('rejects control characters', () => {
      expect(() => sanitizeString('test\x00')).toThrow();
    });

    it('handles special characters', () => {
      const result = sanitizeString('Café & résumé — test');
      expect(result).toContain('Café');
    });
  });

  describe('description validation', () => {
    it('accepts empty string after trim as null (caller handles this)', () => {
      const result = sanitizeString('   ');
      expect(result).toBe('');
    });
  });
});
