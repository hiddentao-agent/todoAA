import 'fake-indexeddb/auto';

// Mock localStorage
const store: Record<string, string> = {};

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  },
  writable: true,
  configurable: true,
});

// Mock crypto.randomUUID
if (typeof crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }),
    },
    writable: true,
  });
}

// Mock navigator.storage
if (typeof navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      storage: {
        estimate: async () => ({ usage: 0, quota: 0 }),
        persist: async () => false,
      },
    },
    writable: true,
  });
}
