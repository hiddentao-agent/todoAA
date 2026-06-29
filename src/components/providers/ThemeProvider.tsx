import { useEffect } from 'preact/hooks';
import { STORAGE_KEY_THEME, type ThemePreference } from '@/utils/storage-keys.ts';

function getEffectiveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return pref;
}

function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function getStoredTheme(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function setStoredTheme(pref: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY_THEME, pref);
  applyTheme(getEffectiveTheme(pref));
}

export function ThemeProvider({ children }: { children: preact.ComponentChildren }) {
  useEffect(() => {
    const pref = getStoredTheme();
    applyTheme(getEffectiveTheme(pref));

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (getStoredTheme() === 'system') {
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return <>{children}</>;
}
