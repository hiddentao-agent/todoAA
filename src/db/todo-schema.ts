/**
 * Database types and schema for the Todo app.
 * Uses Dexie.js v4 for IndexedDB access.
 */

import Dexie, { type EntityTable } from 'dexie';
import { generateId } from '@/utils/id.ts';
import { sanitizeString, isValidPriority, SanitizationError } from '@/utils/sanitize.ts';
import { isQuotaExceededError } from '@/utils/storage.ts';

/* ------------------------------------------------------------------ */
/*  Entity types                                                       */
/* ------------------------------------------------------------------ */

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null; // ISO 8601 date string
  priority: 'none' | 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  listId: string;
  order: number;
}

export interface List {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Input types                                                        */
/* ------------------------------------------------------------------ */

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: 'none' | 'low' | 'medium' | 'high';
  listId: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: 'none' | 'low' | 'medium' | 'high';
  listId?: string;
  order?: number;
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  lists: Array<{
    id: string;
    name: string;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
    priority?: string;
    completed?: boolean;
    createdAt?: string;
    updatedAt?: string;
    listId: string;
    order?: number;
  }>;
}

export interface ImportResult {
  listsImported: number;
  listsSkipped: number;
  tasksImported: number;
  tasksSkipped: number;
}

/* ------------------------------------------------------------------ */
/*  List stats                                                         */
/* ------------------------------------------------------------------ */

export interface ListStats {
  total: number;
  active: number;
  completed: number;
}

/* ------------------------------------------------------------------ */
/*  Database class                                                     */
/* ------------------------------------------------------------------ */

const DEFAULT_LIST_NAME = 'My Tasks';

export class TodoDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  lists!: EntityTable<List, 'id'>;

  constructor() {
    super('TodoApp');
    this.version(1).stores({
      tasks: '&id, [listId+completed], listId',
      lists: '&id',
    });
  }

  /* ================================================================ */
  /*  Initialization                                                   */
  /* ================================================================ */

  async ensureDefaultList(): Promise<List> {
    const existing = await this.lists.toArray();
    if (existing.length === 0) {
      const now = new Date().toISOString();
      const list: List = {
        id: generateId(),
        name: DEFAULT_LIST_NAME,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      };
      await this.lists.add(list);
      return list;
    }
    return existing.find((l) => l.isDefault) ?? existing[0]!;
  }

  /* ================================================================ */
  /*  List CRUD                                                        */
  /* ================================================================ */

  async createList(name: string): Promise<List> {
    const sanitized = sanitizeString(name);
    if (!sanitized || sanitized.length > MAX_LIST_NAME_LENGTH) {
      throw new Error(`List name must be 1–${MAX_LIST_NAME_LENGTH} characters`);
    }
    const now = new Date().toISOString();
    const list: List = {
      id: generateId(),
      name: sanitized,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    await this.lists.add(list);
    return list;
  }

  async renameList(id: string, name: string): Promise<void> {
    const sanitized = sanitizeString(name);
    if (!sanitized || sanitized.length > MAX_LIST_NAME_LENGTH) {
      throw new Error(`List name must be 1–${MAX_LIST_NAME_LENGTH} characters`);
    }
    await this.lists.update(id, {
      name: sanitized,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteListCascade(id: string): Promise<void> {
    const list = await this.lists.get(id);
    if (!list) return;
    if (list.isDefault) {
      throw new Error('Cannot delete the default list');
    }
    await this.transaction('rw', this.tasks, this.lists, async () => {
      await this.tasks.where('listId').equals(id).delete();
      await this.lists.delete(id);
    });
  }

  async getAllLists(): Promise<List[]> {
    const all = await this.lists.toArray();
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /* ================================================================ */
  /*  Task CRUD                                                        */
  /* ================================================================ */

  async createTask(input: CreateTaskInput): Promise<Task> {
    const sanitizedTitle = sanitizeString(input.title);
    if (!sanitizedTitle || sanitizedTitle.length > MAX_TITLE_LENGTH) {
      throw new Error(`Title must be 1–${MAX_TITLE_LENGTH} characters`);
    }

    if (input.description != null) {
      const sanitizedDesc = sanitizeString(input.description);
      if (sanitizedDesc.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Description must be ≤${MAX_DESCRIPTION_LENGTH} characters`);
      }
    }

    const priority = input.priority ?? 'none';
    if (!isValidPriority(priority)) {
      throw new Error(`Invalid priority: ${input.priority}`);
    }

    if (input.dueDate != null && isNaN(new Date(input.dueDate).getTime())) {
      throw new Error('Invalid due date');
    }

    // Verify list exists
    const list = await this.lists.get(input.listId);
    if (!list) {
      throw new Error(`List not found: ${input.listId}`);
    }

    // Get max order for this list
    const maxOrderTask = await this.tasks
      .where('listId')
      .equals(input.listId)
      .reverse()
      .sortBy('order');
    const maxOrder = maxOrderTask.length > 0 ? (maxOrderTask[0]?.order ?? -1) : -1;

    const now = new Date().toISOString();
    const task: Task = {
      id: generateId(),
      title: sanitizedTitle,
      description: input.description != null ? sanitizeString(input.description) : null,
      dueDate: input.dueDate ?? null,
      priority,
      completed: false,
      createdAt: now,
      updatedAt: now,
      listId: input.listId,
      order: maxOrder + 1,
    };

    try {
      await this.tasks.add(task);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new QuotaExceededError();
      }
      throw error;
    }

    return task;
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<void> {
    const changes: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.title !== undefined) {
      const sanitized = sanitizeString(input.title);
      if (!sanitized || sanitized.length > MAX_TITLE_LENGTH) {
        throw new Error(`Title must be 1–${MAX_TITLE_LENGTH} characters`);
      }
      changes.title = sanitized;
    }

    if (input.description !== undefined) {
      if (input.description != null) {
        const sanitized = sanitizeString(input.description);
        if (sanitized.length > MAX_DESCRIPTION_LENGTH) {
          throw new Error(`Description must be ≤${MAX_DESCRIPTION_LENGTH} characters`);
        }
        changes.description = sanitized;
      } else {
        changes.description = null;
      }
    }

    if (input.dueDate !== undefined) {
      if (input.dueDate !== null && isNaN(new Date(input.dueDate).getTime())) {
        throw new Error('Invalid due date');
      }
      changes.dueDate = input.dueDate;
    }

    if (input.priority !== undefined) {
      if (!isValidPriority(input.priority)) {
        throw new Error(`Invalid priority: ${input.priority}`);
      }
      changes.priority = input.priority;
    }

    if (input.listId !== undefined) {
      const list = await this.lists.get(input.listId);
      if (!list) {
        throw new Error(`List not found: ${input.listId}`);
      }
      changes.listId = input.listId;
    }

    if (input.order !== undefined) {
      changes.order = input.order;
    }

    try {
      await this.tasks.update(id, changes);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }

  /**
   * Atomic toggle: reads current completed state and flips it
   * inside a single Dexie transaction — no read-before-write race.
   */
  async toggleTaskCompletion(id: string): Promise<boolean> {
    try {
      return await this.transaction('rw', this.tasks, async () => {
        const task = await this.tasks.get(id);
        if (!task) throw new Error(`Task not found: ${id}`);

        const newCompleted = !task.completed;
        await this.tasks.update(id, {
          completed: newCompleted,
          updatedAt: new Date().toISOString(),
        });

        return newCompleted;
      });
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    await this.tasks.delete(id);
  }

  async getTasksForList(listId: string): Promise<Task[]> {
    return this.tasks
      .where('listId')
      .equals(listId)
      .sortBy('order');
  }

  /**
   * Atomic reorder: reads current tasks for the list and reassigns order
   * values inside a single transaction. Two rapid reorders cannot interleave.
   */
  async reorderTasks(listId: string, orderedIds: string[]): Promise<void> {
    try {
      await this.transaction('rw', this.tasks, async () => {
        const tasks = await this.tasks.where('listId').equals(listId).toArray();
        const taskMap = new Map(tasks.map((t) => [t.id, t]));

        const now = new Date().toISOString();

        for (let i = 0; i < orderedIds.length; i++) {
          const id = orderedIds[i]!;
          const task = taskMap.get(id);
          if (task) {
            await this.tasks.update(id, { order: i, updatedAt: now });
          }
        }
      });
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }

  async moveTaskToList(id: string, targetListId: string): Promise<void> {
    try {
      await this.transaction('rw', this.tasks, this.lists, async () => {
        const task = await this.tasks.get(id);
        if (!task) throw new Error(`Task not found: ${id}`);

        const list = await this.lists.get(targetListId);
        if (!list) throw new Error(`List not found: ${targetListId}`);

        // Get max order in target list
        const maxOrderTask = await this.tasks
          .where('listId')
          .equals(targetListId)
          .reverse()
          .sortBy('order');
        const newOrder = maxOrderTask.length > 0 ? (maxOrderTask[0]?.order ?? -1) + 1 : 0;

        await this.tasks.update(id, {
          listId: targetListId,
          order: newOrder,
          updatedAt: new Date().toISOString(),
        });
      });
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }

  /* ================================================================ */
  /*  List stats                                                        */
  /* ================================================================ */

  async getListStats(listId: string): Promise<ListStats> {
    const tasks = await this.tasks.where('listId').equals(listId).toArray();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }

  async getAllListStats(): Promise<Map<string, ListStats>> {
    const tasks = await this.tasks.toArray();
    const map = new Map<string, ListStats>();

    for (const task of tasks) {
      let stats = map.get(task.listId);
      if (!stats) {
        stats = { total: 0, active: 0, completed: 0 };
        map.set(task.listId, stats);
      }
      stats.total++;
      if (task.completed) {
        stats.completed++;
      } else {
        stats.active++;
      }
    }

    return map;
  }

  /* ================================================================ */
  /*  Export / Import                                                   */
  /* ================================================================ */

  async exportAll(): Promise<ExportData> {
    const lists = await this.lists.toArray();
    const tasks = await this.tasks.toArray();

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      lists: lists.map(({ id, name, isDefault, createdAt, updatedAt }) => ({
        id,
        name,
        isDefault,
        createdAt,
        updatedAt,
      })),
      tasks: tasks.map(
        ({
          id,
          title,
          description,
          dueDate,
          priority,
          completed,
          createdAt,
          updatedAt,
          listId,
          order,
        }) => ({
          id,
          title,
          description,
          dueDate,
          priority,
          completed,
          createdAt,
          updatedAt,
          listId,
          order,
        }),
      ),
    };
  }

  async importJSON(data: ExportData): Promise<ImportResult> {
    const validationError = validateImportPayload(data);
    if (validationError) {
      throw validationError;
    }

    return this.transaction('rw', this.tasks, this.lists, async () => {
      const existingLists = await this.lists.toArray();
      const existingListIds = new Set(existingLists.map((l) => l.id));
      const existingTasks = await this.tasks.toArray();
      const existingTaskIds = new Set(existingTasks.map((t) => t.id));

      const payloadListIds = new Set(data.lists.map((l) => l.id));
      const validListIds = new Set([...existingListIds, ...payloadListIds]);

      let listsImported = 0;
      let listsSkipped = 0;
      let tasksImported = 0;
      let tasksSkipped = 0;

      // Import lists
      for (const list of data.lists) {
        if (existingListIds.has(list.id)) {
          listsSkipped++;
          continue;
        }
        const now = new Date().toISOString();
        await this.lists.add({
          id: list.id,
          name: sanitizeString(list.name),
          isDefault: list.isDefault ?? false,
          createdAt: list.createdAt ?? now,
          updatedAt: list.updatedAt ?? now,
        });
        listsImported++;
      }

      // Import tasks
      for (const task of data.tasks) {
        if (existingTaskIds.has(task.id)) {
          tasksSkipped++;
          continue;
        }
        // Cross-reference: listId must be valid
        if (!validListIds.has(task.listId)) {
          throw new ImportValidationError(
            `Task '${task.title}' references unknown list '${task.listId}'`,
          );
        }
        const now = new Date().toISOString();
        await this.tasks.add({
          id: task.id,
          title: sanitizeString(task.title),
          description: task.description != null ? sanitizeString(task.description) : null,
          dueDate: task.dueDate ?? null,
          priority: isValidPriority(task.priority ?? '') ? (task.priority as Task['priority']) : 'none',
          completed: task.completed ?? false,
          createdAt: task.createdAt ?? now,
          updatedAt: task.updatedAt ?? now,
          listId: task.listId,
          order: task.order ?? 0,
        });
        tasksImported++;
      }

      return { listsImported, listsSkipped, tasksImported, tasksSkipped };
    });
  }

  /* ================================================================ */
  /*  Danger zone                                                       */
  /* ================================================================ */

  async deleteAllData(): Promise<void> {
    await this.transaction('rw', this.tasks, this.lists, async () => {
      await this.tasks.clear();
      await this.lists.clear();
    });
    await this.ensureDefaultList();
  }
}

/* ------------------------------------------------------------------ */
/*  Import validation                                                  */
/* ------------------------------------------------------------------ */

const MAX_TASKS = 10_000;
const MAX_LISTS = 1_000;
export const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5 MB

/* ------------------------------------------------------------------ */
/*  Shared limits                                                      */
/* ------------------------------------------------------------------ */

export const MAX_TITLE_LENGTH = 500;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_LIST_NAME_LENGTH = 200;

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportValidationError';
  }
}

export function validateImportPayload(data: unknown): ImportValidationError | null {
  if (!data || typeof data !== 'object') {
    return new ImportValidationError('Invalid JSON: expected an object');
  }

  const d = data as Record<string, unknown>;

  if (d.version !== 1) {
    return new ImportValidationError(`Unsupported format version: ${d.version}`);
  }

  if (!Array.isArray(d.lists)) {
    return new ImportValidationError('Invalid format: expected { lists: [...], tasks: [...] }');
  }

  if (!Array.isArray(d.tasks)) {
    return new ImportValidationError('Invalid format: expected { lists: [...], tasks: [...] }');
  }

  // Row count caps
  if (d.lists.length > MAX_LISTS) {
    return new ImportValidationError(
      `Too many records: ${d.tasks.length} tasks, ${d.lists.length} lists. Maximum is ${MAX_TASKS} tasks and ${MAX_LISTS} lists.`,
    );
  }

  if (d.tasks.length > MAX_TASKS) {
    return new ImportValidationError(
      `Too many records: ${d.tasks.length} tasks, ${d.lists.length} lists. Maximum is ${MAX_TASKS} tasks and ${MAX_LISTS} lists.`,
    );
  }

  // Validate each list
  for (let i = 0; i < d.lists.length; i++) {
    const list = d.lists[i] as Record<string, unknown>;
    if (!list.id || typeof list.id !== 'string') {
      return new ImportValidationError(`List at index ${i}: missing or invalid id`);
    }
    if (!list.name || typeof list.name !== 'string') {
      return new ImportValidationError(`List '${list.id}': missing or invalid name`);
    }
    try {
      sanitizeString(list.name);
    } catch (e) {
      return new ImportValidationError(
        `List '${list.id}': ${(e as SanitizationError).message}`,
      );
    }
    if (typeof list.name === 'string' && (list.name.length === 0 || list.name.length > MAX_LIST_NAME_LENGTH)) {
      return new ImportValidationError(`List '${list.id}': name must be 1–${MAX_LIST_NAME_LENGTH} characters`);
    }
  }

  // Validate each task
  for (let i = 0; i < d.tasks.length; i++) {
    const task = d.tasks[i] as Record<string, unknown>;
    if (!task.id || typeof task.id !== 'string') {
      return new ImportValidationError(`Task at index ${i}: missing or invalid id`);
    }
    if (!task.title || typeof task.title !== 'string') {
      return new ImportValidationError(`Task '${task.id}': missing or invalid title`);
    }
    try {
      sanitizeString(task.title);
    } catch (e) {
      return new ImportValidationError(
        `Task '${task.id}': ${(e as SanitizationError).message}`,
      );
    }
    if (typeof task.title === 'string' && (task.title.length === 0 || task.title.length > MAX_TITLE_LENGTH)) {
      return new ImportValidationError(`Task '${task.id}': title must be 1–${MAX_TITLE_LENGTH} characters`);
    }
    if (task.description != null && typeof task.description === 'string') {
      try {
        sanitizeString(task.description);
      } catch (e) {
        return new ImportValidationError(
          `Task '${task.id}': ${(e as SanitizationError).message}`,
        );
      }
      if (task.description.length > MAX_DESCRIPTION_LENGTH) {
        return new ImportValidationError(`Task '${task.id}': description must be ≤${MAX_DESCRIPTION_LENGTH} characters`);
      }
    }
    if (task.priority !== undefined && !isValidPriority(task.priority as string)) {
      return new ImportValidationError(`Task '${task.id}': invalid priority '${task.priority}'`);
    }
    if (task.dueDate != null) {
      if (typeof task.dueDate !== 'string' || isNaN(new Date(task.dueDate).getTime())) {
        return new ImportValidationError(`Task '${task.id}': invalid due date '${task.dueDate}'`);
      }
    }
  }

  return null;
}

export class QuotaExceededError extends Error {
  constructor() {
    super('Storage is full. Export your data to free up space or clear some tasks.');
    this.name = 'QuotaExceededError';
  }
}
