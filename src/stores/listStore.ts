import { signal, computed } from '@preact/signals';
import type { TodoDatabase, List, ListStats } from '@/db/todo-schema.ts';

let db: TodoDatabase;

export function initializeListStore(database: TodoDatabase) {
  db = database;
}

// --- Signals ---

export const lists = signal<List[]>([]);
export const currentListId = signal<string | null>(null);
export const listStats = signal<Map<string, ListStats>>(new Map());

// --- Derived ---

export const currentList = computed(() => {
  if (!currentListId.value) return null;
  return lists.value.find((l) => l.id === currentListId.value) ?? null;
});

export const defaultList = computed(() => {
  return lists.value.find((l) => l.isDefault) ?? null;
});

// --- Operations ---

export async function loadLists(): Promise<void> {
  const allLists = await db.getAllLists();
  lists.value = allLists;
  const stats = await db.getAllListStats();
  listStats.value = stats;

  if (!currentListId.value) {
    const stored = localStorage.getItem('todo-current-list');
    if (stored && allLists.some((l) => l.id === stored)) {
      currentListId.value = stored;
    } else {
      currentListId.value = allLists[0]?.id ?? null;
    }
  }
}

export async function createList(name: string): Promise<List> {
  const list = await db.createList(name);
  await loadLists();
  return list;
}

export async function renameList(id: string, name: string): Promise<void> {
  await db.renameList(id, name);
  await loadLists();
}

export async function deleteListCascade(id: string): Promise<void> {
  await db.deleteListCascade(id);
  // If we deleted the current list, switch to default
  if (currentListId.value === id) {
    const allLists = await db.getAllLists();
    currentListId.value = allLists[0]?.id ?? null;
    if (currentListId.value) {
      localStorage.setItem('todo-current-list', currentListId.value);
    }
  }
  await loadLists();
}

export function selectList(id: string): void {
  currentListId.value = id;
  localStorage.setItem('todo-current-list', id);
}
