import { signal } from '@preact/signals';
import type { TodoDatabase, Task, CreateTaskInput, UpdateTaskInput } from '@/db/todo-schema.ts';
import { currentListId, loadLists } from '@/stores/listStore.ts';

let db: TodoDatabase;

export function initializeTaskStore(database: TodoDatabase) {
  db = database;
}

// --- Signals ---

export const tasks = signal<Task[]>([]);
export const tasksLoading = signal<boolean>(true);
export const tasksError = signal<string | null>(null);

// --- Operations ---

export async function loadTasks(): Promise<void> {
  if (!currentListId.value) return;
  tasksLoading.value = true;
  tasksError.value = null;
  try {
    const result = await db.getTasksForList(currentListId.value);
    tasks.value = result;
  } catch (error) {
    if (error instanceof Error) {
      tasksError.value = error.message;
    }
  } finally {
    tasksLoading.value = false;
  }
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const task = await db.createTask(input);
  await Promise.all([loadTasks(), loadLists()]);
  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<void> {
  await db.updateTask(id, input);
  await loadTasks();
}

export async function toggleTaskCompletion(id: string): Promise<boolean> {
  const result = await db.toggleTaskCompletion(id);
  await Promise.all([loadTasks(), loadLists()]);
  return result;
}

export async function deleteTask(id: string): Promise<void> {
  await db.deleteTask(id);
  await Promise.all([loadTasks(), loadLists()]);
}

export async function reorderTasks(orderedIds: string[]): Promise<void> {
  if (!currentListId.value) return;
  await db.reorderTasks(currentListId.value, orderedIds);
  await loadTasks();
}

export async function moveTaskToList(id: string, targetListId: string): Promise<void> {
  await db.moveTaskToList(id, targetListId);
  await loadTasks();
}
