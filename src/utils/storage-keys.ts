/** localStorage key constants — namespace prefix 'todo-' defined once */

const PREFIX = 'todo-';

export const STORAGE_KEY_THEME = `${PREFIX}theme` as const;
export const STORAGE_KEY_CURRENT_LIST = `${PREFIX}current-list` as const;
export const STORAGE_KEY_SORT = `${PREFIX}sort` as const;

export type ThemePreference = 'light' | 'dark' | 'system';
export type SortMode = 'manual' | 'dueDate' | 'createdAt' | 'priority';
