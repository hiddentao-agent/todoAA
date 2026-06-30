import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStoredTheme, setStoredTheme } from '@/components/providers/ThemeProvider.tsx';

describe('getStoredTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns "system" when no preference stored', () => {
    expect(getStoredTheme()).toBe('system');
  });

  it('returns stored "light" preference', () => {
    localStorage.setItem('todo-theme', 'light');
    expect(getStoredTheme()).toBe('light');
  });

  it('returns stored "dark" preference', () => {
    localStorage.setItem('todo-theme', 'dark');
    expect(getStoredTheme()).toBe('dark');
  });

  it('returns "system" for invalid stored value', () => {
    localStorage.setItem('todo-theme', 'invalid');
    expect(getStoredTheme()).toBe('system');
  });
});

describe('setStoredTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('stores theme preference in localStorage', () => {
    setStoredTheme('dark');
    expect(localStorage.getItem('todo-theme')).toBe('dark');
  });

  it('sets data-theme attribute on document element', () => {
    setStoredTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('applies light theme from system preference when no dark match', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    setStoredTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
