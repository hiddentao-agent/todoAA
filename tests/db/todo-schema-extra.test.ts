import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TodoDatabase,
  QuotaExceededError,
  validateImportPayload,
  ImportValidationError,
} from '@/db/todo-schema.ts';
import type { ExportData } from '@/db/todo-schema.ts';

describe('TodoDatabase — QuotaExceededError handling', () => {
  let db: TodoDatabase;

  beforeEach(async () => {
    db = new TodoDatabase();
    await db.open();
    await db.transaction('rw', db.tasks, db.lists, async () => {
      await db.tasks.clear();
      await db.lists.clear();
    });
  });

  /* ---------------------------------------------------------- */
  /*  toggleTaskCompletion                                       */
  /* ---------------------------------------------------------- */

  describe('toggleTaskCompletion', () => {
    it('throws QuotaExceededError on quota exceeded', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Toggle me', listId: list.id });

      // Make tasks.get throw a QuotaExceededError DOMException inside the transaction
      vi.spyOn(db.tasks, 'get').mockRejectedValueOnce(
        new DOMException('Storage quota reached', 'QuotaExceededError'),
      );

      await expect(db.toggleTaskCompletion(task.id)).rejects.toThrow(QuotaExceededError);
    });

    it('re-throws non-quota errors normally', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Toggle me', listId: list.id });

      vi.spyOn(db.tasks, 'get').mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      await expect(db.toggleTaskCompletion(task.id)).rejects.toThrow('Unexpected error');
    });
  });

  /* ---------------------------------------------------------- */
  /*  reorderTasks                                              */
  /* ---------------------------------------------------------- */

  describe('reorderTasks', () => {
    it('throws QuotaExceededError on quota exceeded', async () => {
      const list = await db.ensureDefaultList();
      const t1 = await db.createTask({ title: 'A', listId: list.id });
      const t2 = await db.createTask({ title: 'B', listId: list.id });

      // Make tasks.update throw a QuotaExceededError inside the transaction
      vi.spyOn(db.tasks, 'update').mockRejectedValueOnce(
        new DOMException('Quota exceeded', 'QuotaExceededError'),
      );

      await expect(db.reorderTasks(list.id, [t2.id, t1.id])).rejects.toThrow(QuotaExceededError);
    });

    it('re-throws non-quota errors normally', async () => {
      const list = await db.ensureDefaultList();
      const t1 = await db.createTask({ title: 'A', listId: list.id });
      const t2 = await db.createTask({ title: 'B', listId: list.id });

      vi.spyOn(db.tasks, 'update').mockRejectedValueOnce(
        new Error('Something went wrong'),
      );

      await expect(db.reorderTasks(list.id, [t1.id, t2.id])).rejects.toThrow('Something went wrong');
    });
  });

  /* ---------------------------------------------------------- */
  /*  moveTaskToList                                            */
  /* ---------------------------------------------------------- */

  describe('moveTaskToList', () => {
    it('throws QuotaExceededError on quota exceeded', async () => {
      const list1 = await db.createList('List A');
      const list2 = await db.createList('List B');
      const task = await db.createTask({ title: 'Movable', listId: list1.id });

      // Make tasks.update throw a QuotaExceededError inside the transaction
      vi.spyOn(db.tasks, 'update').mockRejectedValueOnce(
        new DOMException('Quota exceeded', 'QuotaExceededError'),
      );

      await expect(db.moveTaskToList(task.id, list2.id)).rejects.toThrow(QuotaExceededError);
    });

    it('re-throws non-quota errors normally', async () => {
      const list1 = await db.createList('List A');
      const list2 = await db.createList('List B');
      const task = await db.createTask({ title: 'Movable', listId: list1.id });

      vi.spyOn(db.tasks, 'update').mockRejectedValueOnce(
        new Error('Update failed'),
      );

      await expect(db.moveTaskToList(task.id, list2.id)).rejects.toThrow('Update failed');
    });
  });

  /* ---------------------------------------------------------- */
  /*  createTask — quota exceeded in Dexie add                   */
  /* ---------------------------------------------------------- */

  describe('createTask', () => {
    it('throws QuotaExceededError when Dexie add throws quota error', async () => {
      const list = await db.ensureDefaultList();

      vi.spyOn(db.tasks, 'add').mockRejectedValueOnce(
        new DOMException('Quota exceeded', 'QuotaExceededError'),
      );

      await expect(
        db.createTask({ title: 'Will fail', listId: list.id }),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('re-throws non-quota Dexie errors normally', async () => {
      const list = await db.ensureDefaultList();

      vi.spyOn(db.tasks, 'add').mockRejectedValueOnce(
        new Error('Dexie internal error'),
      );

      await expect(
        db.createTask({ title: 'Will fail', listId: list.id }),
      ).rejects.toThrow('Dexie internal error');
    });
  });

  /* ---------------------------------------------------------- */
  /*  updateTask — quota exceeded in Dexie update                */
  /* ---------------------------------------------------------- */

  describe('updateTask', () => {
    it('throws QuotaExceededError when Dexie update throws quota error', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Update me', listId: list.id });

      vi.spyOn(db.tasks, 'update').mockRejectedValueOnce(
        new DOMException('Quota exceeded', 'QuotaExceededError'),
      );

      await expect(
        db.updateTask(task.id, { title: 'New title' }),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('re-throws non-quota errors normally', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Update me', listId: list.id });

      vi.spyOn(db.tasks, 'update').mockRejectedValueOnce(
        new Error('Update failed'),
      );

      await expect(
        db.updateTask(task.id, { title: 'New title' }),
      ).rejects.toThrow('Update failed');
    });
  });
});

/* ---------------------------------------------------------------- */
/*  ensureDefaultList — additional edge cases                        */
/* ---------------------------------------------------------------- */

describe('TodoDatabase — ensureDefaultList', () => {
  let db: TodoDatabase;

  beforeEach(async () => {
    db = new TodoDatabase();
    await db.open();
    await db.transaction('rw', db.tasks, db.lists, async () => {
      await db.tasks.clear();
      await db.lists.clear();
    });
  });

  it('creates a default list when DB is empty', async () => {
    const list = await db.ensureDefaultList();
    expect(list).toBeDefined();
    expect(list.name).toBe('My Tasks');
    expect(list.isDefault).toBe(true);
    expect(list.id).toBeTruthy();
    expect(list.createdAt).toBeTruthy();
    expect(list.updatedAt).toBeTruthy();
  });

  it('returns the existing default-marked list when one exists', async () => {
    // First call creates it
    const first = await db.ensureDefaultList();
    expect(first.isDefault).toBe(true);

    // Second call should return the same list
    const second = await db.ensureDefaultList();
    expect(second.id).toBe(first.id);
    expect(second.name).toBe('My Tasks');
    expect(second.isDefault).toBe(true);
  });

  it('returns default-marked list when a non-default list also exists', async () => {
    const defaultList = await db.ensureDefaultList();
    await db.createList('Shopping');

    // ensureDefaultList should return the default one, not the custom one
    const result = await db.ensureDefaultList();
    expect(result.id).toBe(defaultList.id);
    expect(result.isDefault).toBe(true);
    expect(result.name).toBe('My Tasks');
  });

  it('returns the first list as fallback when none is marked default', async () => {
    // Manually insert lists without any default
    const list1 = await db.createList('First');
    const list2 = await db.createList('Second');

    // Clear default flag from all lists
    await db.lists.update(list1.id, { isDefault: false });
    await db.lists.update(list2.id, { isDefault: false });

    // ensureDefaultList should pick the first list returned by Dexie (key order)
    const result = await db.ensureDefaultList();
    expect(result.isDefault).toBe(false);
    // It should return one of the existing lists
    expect([list1.id, list2.id]).toContain(result.id);
  });

  it('stores the list in the database', async () => {
    const list = await db.ensureDefaultList();
    const stored = await db.lists.get(list.id);
    expect(stored).toBeDefined();
    expect(stored!.name).toBe('My Tasks');
    expect(stored!.isDefault).toBe(true);
  });
});

/* ---------------------------------------------------------------- */
/*  validateImportPayload — edge cases                               */
/* ---------------------------------------------------------------- */

describe('validateImportPayload', () => {
  it('rejects task with missing title', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [{ id: 't1', listId: 'l1', priority: 'none', completed: false }],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/missing or invalid title/);
  });

  it('rejects task with non-string title', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [{ id: 't1', title: 123, listId: 'l1', priority: 'none', completed: false }],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/missing or invalid title/);
  });

  it('rejects task with empty title (falsy → missing error)', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [{ id: 't1', title: '', listId: 'l1', priority: 'none', completed: false }],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    // empty string is falsy, so !task.title catches it first
    expect(err!.message).toMatch(/missing or invalid title/);
  });

  it('rejects task with title exceeding 500 characters', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [
        {
          id: 't1',
          title: 'a'.repeat(501),
          listId: 'l1',
          priority: 'none',
          completed: false,
        },
      ],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/title must be 1–500/);
  });

  it('rejects task with title exceeding 500 characters', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [
        {
          id: 't1',
          title: 'x'.repeat(501),
          listId: 'l1',
          priority: 'none',
          completed: false,
        },
      ],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/title must be 1–500/);
  });

  it('rejects task with description containing control characters', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [
        {
          id: 't1',
          title: 'Valid Title',
          description: 'Valid before null char after',
          listId: 'l1',
          priority: 'none',
          completed: false,
        },
      ],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/invalid control characters|description/);
  });

  it('rejects task with description exceeding 5000 characters', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [
        {
          id: 't1',
          title: 'Valid Title',
          description: 'x'.repeat(5001),
          listId: 'l1',
          priority: 'none',
          completed: false,
        },
      ],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/≤5000/);
  });

  it('rejects list with missing name', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', isDefault: true }],
      tasks: [],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/missing or invalid name/);
  });

  it('rejects list with non-string name', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 123, isDefault: true }],
      tasks: [],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/missing or invalid name/);
  });

  it('trims whitespace-only name (still passes because sanitize only checks control chars)', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: '   ', isDefault: true }],
      tasks: [],
    };
    const err = validateImportPayload(payload);
    // sanitizeString('   ') returns '' without throwing.
    // The length check is against the original (untrimmed) value '   ' which is length 3.
    expect(err).toBeNull();
  });

  it('rejects list with name containing control characters', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'Bad Name', isDefault: true }],
      tasks: [],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/invalid control characters/);
  });

  it('rejects list with name exceeding 200 characters', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'x'.repeat(201), isDefault: true }],
      tasks: [],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/name must be 1–200/);
  });

  it('rejects task with missing id', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [{ title: 'No ID', listId: 'l1', priority: 'none', completed: false }],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/missing or invalid id/);
  });

  it('passes validation for a valid payload', () => {
    const payload: ExportData = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 'l1', name: 'List', isDefault: true }],
      tasks: [
        {
          id: 't1',
          title: 'Valid Task',
          description: 'A description',
          listId: 'l1',
          priority: 'high',
          completed: false,
          order: 0,
        },
      ],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeNull();
  });

  it('rejects null data', () => {
    const err = validateImportPayload(null);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/expected an object/);
  });

  it('rejects non-object data', () => {
    const err = validateImportPayload('string');
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/expected an object/);
  });

  it('rejects payload with missing tasks array', () => {
    const err = validateImportPayload({ version: 1, lists: [] });
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/Invalid format.*lists.*tasks/);
  });

  it('rejects list with missing id', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ name: 'List' }],
      tasks: [],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/missing or invalid id/);
  });

  it('rejects list with non-string id', () => {
    const payload: unknown = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: 123, name: 'List' }],
      tasks: [],
    };
    const err = validateImportPayload(payload);
    expect(err).toBeInstanceOf(ImportValidationError);
    expect(err!.message).toMatch(/missing or invalid id/);
  });
});

/* ---------------------------------------------------------------- */
/*  importJSON — priority fallback                                  */
/* ---------------------------------------------------------------- */

describe('TodoDatabase — importJSON priority fallback', () => {
  let db: TodoDatabase;

  beforeEach(async () => {
    db = new TodoDatabase();
    await db.open();
    await db.transaction('rw', db.tasks, db.lists, async () => {
      await db.tasks.clear();
      await db.lists.clear();
    });
    await db.ensureDefaultList();
  });

  it('defaults missing priority to "none"', async () => {
    const list = await db.ensureDefaultList();
    const payload: ExportData = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [],
      tasks: [
        {
          id: 't-no-priority',
          title: 'No Priority',
          listId: list.id,
          completed: false,
          order: 0,
        },
      ],
    };
    // priority is omitted from the task object — it will be undefined
    const result = await db.importJSON(payload);
    expect(result.tasksImported).toBe(1);

    const task = await db.tasks.get('t-no-priority');
    expect(task!.priority).toBe('none');
  });
});

/* ---------------------------------------------------------------- */
/*  importJSON — duplicate handling                                  */
/* ---------------------------------------------------------------- */

describe('TodoDatabase — importJSON duplicates', () => {
  let db: TodoDatabase;

  beforeEach(async () => {
    db = new TodoDatabase();
    await db.open();
    await db.transaction('rw', db.tasks, db.lists, async () => {
      await db.tasks.clear();
      await db.lists.clear();
    });
  });

  it('skips duplicate lists', async () => {
    const list = await db.ensureDefaultList();
    const payload: ExportData = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [{ id: list.id, name: 'Already Exists', isDefault: true }],
      tasks: [],
    };
    const result = await db.importJSON(payload);
    expect(result.listsImported).toBe(0);
    expect(result.listsSkipped).toBe(1);
  });

  it('skips duplicate tasks', async () => {
    const list = await db.ensureDefaultList();
    const task = await db.createTask({ title: 'Existing', listId: list.id });
    const payload: ExportData = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      lists: [],
      tasks: [{
        id: task.id,
        title: 'Duplicate Task',
        listId: list.id,
        priority: 'none',
        completed: false,
        order: 0,
      }],
    };
    const result = await db.importJSON(payload);
    expect(result.tasksImported).toBe(0);
    expect(result.tasksSkipped).toBe(1);
  });
});

/* ---------------------------------------------------------------- */
/*  importJSON — cross-reference validation in transaction           */
/* ---------------------------------------------------------------- */

describe('TodoDatabase — importJSON cross-reference', () => {
  let db: TodoDatabase;

  beforeEach(async () => {
    db = new TodoDatabase();
    await db.open();
    await db.transaction('rw', db.tasks, db.lists, async () => {
      await db.tasks.clear();
      await db.lists.clear();
    });
  });

  it('throws when a task references a listId not in existing or payload lists', async () => {
    await db.ensureDefaultList();
    const payload: ExportData = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      // lists does NOT include 'ghost-list'
      lists: [],
      tasks: [
        {
          id: 'orphan-task',
          title: 'Orphaned',
          listId: 'ghost-list',
          priority: 'none',
          completed: false,
          order: 0,
        },
      ],
    };
    await expect(db.importJSON(payload)).rejects.toThrow('references unknown list');
  });
});
