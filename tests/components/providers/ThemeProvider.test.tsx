import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/preact';
import {
  ThemeProvider,
  setStoredTheme,
  getStoredTheme,
} from '@/components/providers/ThemeProvider.tsx';

// matchMedia is undefined in jsdom, so define it here
function createMatchMedia(matches = false) {
  return (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

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
    window.matchMedia = createMatchMedia(false) as typeof window.matchMedia;
  });

  it('stores theme preference in localStorage', () => {
    setStoredTheme('dark');
    expect(localStorage.getItem('todo-theme')).toBe('dark');
  });

  it('sets data-theme attribute on document element for explicit dark', () => {
    setStoredTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sets data-theme attribute on document element for explicit light', () => {
    setStoredTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('reads system preference when set to "system" and dark mode active', () => {
    window.matchMedia = createMatchMedia(true) as typeof window.matchMedia;

    setStoredTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('reads system preference when set to "system" and dark mode inactive', () => {
    window.matchMedia = createMatchMedia(false) as typeof window.matchMedia;

    setStoredTheme('system');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('ThemeProvider', () => {
  let mediaQueryListeners: Record<string, () => void>;
  let matchMediaImpl: (query: string) => MediaQueryList;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    mediaQueryListeners = {};

    matchMediaImpl = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, cb: () => void) => {
          mediaQueryListeners[event] = cb;
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList;

    window.matchMedia = matchMediaImpl as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children', () => {
    const { container } = render(
      <ThemeProvider>
        <span>hello</span>
      </ThemeProvider>,
    );
    expect(container.textContent).toBe('hello');
  });

  it('applies "light" theme when system prefers light', () => {
    render(<ThemeProvider>test</ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('applies "dark" theme when system prefers dark', () => {
    window.matchMedia = ((query: string) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as typeof window.matchMedia;

    render(<ThemeProvider>test</ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('uses stored theme preference over system preference', () => {
    localStorage.setItem('todo-theme', 'dark');

    // System prefers light
    window.matchMedia = ((query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as typeof window.matchMedia;

    render(<ThemeProvider>test</ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('registers a "change" listener on the media query', () => {
    render(<ThemeProvider>test</ThemeProvider>);
    expect(mediaQueryListeners['change']).toBeDefined();
  });

  it('reacts to system theme change when preference is "system"', () => {
    const mediaQueryMatches = { current: false };
    window.matchMedia = ((query: string) =>
      ({
        get matches() {
          return mediaQueryMatches.current;
        },
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, cb: () => void) => {
          mediaQueryListeners[event] = cb;
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;

    render(<ThemeProvider>test</ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // System switches to dark
    mediaQueryMatches.current = true;
    mediaQueryListeners['change']!();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // System switches back to light
    mediaQueryMatches.current = false;
    mediaQueryListeners['change']!();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('does NOT react to system theme change when stored preference is explicit', () => {
    const mediaQueryMatches = { current: false };
    window.matchMedia = ((query: string) =>
      ({
        get matches() {
          return mediaQueryMatches.current;
        },
        media: query,
        onchange: null,
        addEventListener: vi.fn((event: string, cb: () => void) => {
          mediaQueryListeners[event] = cb;
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;

    localStorage.setItem('todo-theme', 'dark');
    render(<ThemeProvider>test</ThemeProvider>);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    // System switches preference, but stored is explicit
    mediaQueryMatches.current = true;
    mediaQueryListeners['change']!();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('setStoredTheme updates the data-theme attribute', () => {
    render(<ThemeProvider>test</ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    setStoredTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
