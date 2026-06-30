import { signal } from '@preact/signals';
import type { SortMode } from '@/utils/storage-keys.ts';
import { STORAGE_KEY_SORT } from '@/utils/storage-keys.ts';

// --- Signals ---

export const activeFilter = signal<'all' | 'active' | 'completed'>('all');
export const activeSort = signal<SortMode>('manual');
export const sortDirection = signal<'asc' | 'desc'>('asc');
export const sidebarOpen = signal<boolean>(false);
export const settingsOpen = signal<boolean>(false);
export const taskFormOpen = signal<boolean>(false);
export const editingTaskId = signal<string | null>(null);
export const toastMessage = signal<string | null>(null);
export const announcerMessage = signal<string>('');

// --- Operations ---

export function setFilter(filter: 'all' | 'active' | 'completed'): void {
  activeFilter.value = filter;
}

export function setSort(sort: SortMode): void {
  activeSort.value = sort;
  localStorage.setItem(STORAGE_KEY_SORT, sort);
}

export function toggleSortDirection(): void {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
}

export function toggleSidebar(): void {
  sidebarOpen.value = !sidebarOpen.value;
}

export function closeSidebar(): void {
  sidebarOpen.value = false;
}

export function openSettings(): void {
  settingsOpen.value = true;
}

export function closeSettings(): void {
  settingsOpen.value = false;
}

export function openTaskForm(taskId?: string): void {
  editingTaskId.value = taskId ?? null;
  taskFormOpen.value = true;
}

export function closeTaskForm(): void {
  taskFormOpen.value = false;
  editingTaskId.value = null;
}

export function announce(message: string): void {
  // Clear first so the same message re-triggers the live region
  announcerMessage.value = '';
  requestAnimationFrame(() => {
    announcerMessage.value = message;
  });
}

export function showToast(message: string): void {
  toastMessage.value = message;
  announce(message);
  setTimeout(() => {
    if (toastMessage.value === message) {
      toastMessage.value = null;
    }
  }, 2000);
}

export function loadSortPreference(): void {
  const stored = localStorage.getItem(STORAGE_KEY_SORT);
  if (stored === 'manual' || stored === 'dueDate' || stored === 'createdAt' || stored === 'priority') {
    activeSort.value = stored;
  }
}
