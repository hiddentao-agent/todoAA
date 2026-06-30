import { describe, it, expect, beforeEach } from 'vitest';
import { TodoDatabase } from '@/db/todo-schema.ts';
import type { ExportData } from '@/db/todo-schema.ts';

describe('TodoDatabase', () => {
  let db: TodoDatabase;

  beforeEach(async () => {
    db = new TodoDatabase();
    await db.open();
    // Clear all data to ensure test isolation
    await db.transaction('rw', db.tasks, db.lists, async () => {
      await db.tasks.clear();
      await db.lists.clear();
    });
  });

  describe('ensureDefaultList', () => {
    it('creates a default list on first call', async () => {
      const list = await db.ensureDefaultList();
      expect(list.name).toBe('My Tasks');
      expect(list.isDefault).toBe(true);
      expect(list.id).toBeTruthy();
    });

    it('returns existing list on subsequent calls', async () => {
      const first = await db.ensureDefaultList();
      const second = await db.ensureDefaultList();
      expect(second.id).toBe(first.id);
    });
  });

  describe('createTask', () => {
    it('creates a task with required fields', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Test task', listId: list.id });
      expect(task.title).toBe('Test task');
      expect(task.completed).toBe(false);
      expect(task.priority).toBe('none');
      expect(task.order).toBe(0);
    });

    it('creates a task with all optional fields', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({
        title: 'Full task',
        description: 'A description',
        dueDate: '2026-07-01',
        priority: 'high',
        listId: list.id,
      });
      expect(task.description).toBe('A description');
      expect(task.dueDate).toBe('2026-07-01');
      expect(task.priority).toBe('high');
    });

    it('assigns sequential order values', async () => {
      const list = await db.ensureDefaultList();
      const t1 = await db.createTask({ title: 'First', listId: list.id });
      const t2 = await db.createTask({ title: 'Second', listId: list.id });
      expect(t1.order).toBe(0);
      expect(t2.order).toBe(1);
    });

    it('rejects empty title', async () => {
      const list = await db.ensureDefaultList();
      await expect(db.createTask({ title: '   ', listId: list.id })).rejects.toThrow();
    });

    it('rejects title exceeding 500 characters', async () => {
      const list = await db.ensureDefaultList();
      await expect(db.createTask({ title: 'x'.repeat(501), listId: list.id })).rejects.toThrow();
    });

    it('rejects invalid priority', async () => {
      const list = await db.ensureDefaultList();
      await expect(
        db.createTask({ title: 'Test', priority: 'urgent' as never, listId: list.id }),
      ).rejects.toThrow('Invalid priority');
    });

    it('rejects non-existent list', async () => {
      await expect(db.createTask({ title: 'Test', listId: 'nonexistent' })).rejects.toThrow(
        'List not found',
      );
    });
  });

  describe('toggleTaskCompletion', () => {
    it('toggles from false to true', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Toggle me', listId: list.id });
      const result = await db.toggleTaskCompletion(task.id);
      expect(result).toBe(true);
      const updated = await db.tasks.get(task.id);
      expect(updated!.completed).toBe(true);
    });

    it('toggles from true to false', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Toggle me', listId: list.id });
      await db.toggleTaskCompletion(task.id);
      const result = await db.toggleTaskCompletion(task.id);
      expect(result).toBe(false);
      const updated = await db.tasks.get(task.id);
      expect(updated!.completed).toBe(false);
    });
  });

  describe('updateTask', () => {
    it('updates task fields', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Original', listId: list.id });
      await db.updateTask(task.id, { title: 'Updated', priority: 'high' });
      const updated = await db.tasks.get(task.id);
      expect(updated!.title).toBe('Updated');
      expect(updated!.priority).toBe('high');
    });
  });

  describe('deleteTask', () => {
    it('deletes a task', async () => {
      const list = await db.ensureDefaultList();
      const task = await db.createTask({ title: 'Delete me', listId: list.id });
      await db.deleteTask(task.id);
      const result = await db.tasks.get(task.id);
      expect(result).toBeUndefined();
    });
  });

  describe('reorderTasks', () => {
    it('reassigns order values', async () => {
      const list = await db.ensureDefaultList();
      const t1 = await db.createTask({ title: 'A', listId: list.id });
      const t2 = await db.createTask({ title: 'B', listId: list.id });
      const t3 = await db.createTask({ title: 'C', listId: list.id });

      await db.reorderTasks(list.id, [t3.id, t1.id, t2.id]);

      const tasks = await db.getTasksForList(list.id);
      expect(tasks.find((t) => t.id === t3.id)!.order).toBe(0);
      expect(tasks.find((t) => t.id === t1.id)!.order).toBe(1);
      expect(tasks.find((t) => t.id === t2.id)!.order).toBe(2);
    });
  });

  describe('list CRUD', () => {
    it('creates a list', async () => {
      const list = await db.createList('Work');
      expect(list.name).toBe('Work');
      expect(list.isDefault).toBe(false);
    });

    it('renames a list', async () => {
      const list = await db.createList('Work');
      await db.renameList(list.id, 'Personal');
      const updated = await db.lists.get(list.id);
      expect(updated!.name).toBe('Personal');
    });

    it('prevents deleting the default list', async () => {
      const list = await db.ensureDefaultList();
      await expect(db.deleteListCascade(list.id)).rejects.toThrow('Cannot delete the default list');
    });

    it('cascade-deletes tasks when deleting a list', async () => {
      const list = await db.createList('Shopping');
      await db.createTask({ title: 'Buy milk', listId: list.id });
      await db.deleteListCascade(list.id);
      const tasks = await db.tasks.where('listId').equals(list.id).toArray();
      expect(tasks).toHaveLength(0);
    });
  });

  describe('moveTaskToList', () => {
    it('moves a task between lists', async () => {
      const list1 = await db.createList('List A');
      const list2 = await db.createList('List B');
      const task = await db.createTask({ title: 'Movable', listId: list1.id });

      await db.moveTaskToList(task.id, list2.id);

      const updated = await db.tasks.get(task.id);
      expect(updated!.listId).toBe(list2.id);
    });
  });

  describe('getListStats', () => {
    it('returns correct counts', async () => {
      const list = await db.ensureDefaultList();
      await db.createTask({ title: 'Active task', listId: list.id });
      const completed = await db.createTask({ title: 'Done task', listId: list.id });
      await db.toggleTaskCompletion(completed.id);

      const stats = await db.getListStats(list.id);
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.completed).toBe(1);
    });
  });

  describe('exportAll', () => {
    it('exports all data', async () => {
      const list = await db.ensureDefaultList();
      await db.createTask({ title: 'Export test', listId: list.id });

      const result = await db.exportAll();
      expect(result.version).toBe(1);
      expect(result.lists.length).toBeGreaterThan(0);
      expect(result.tasks.length).toBeGreaterThan(0);
    });
  });

  describe('importJSON', () => {
    it('imports lists and tasks', async () => {
      const data = await db.exportAll();
      // Add a new list and task via import
      data.lists.push({
        id: 'imported-list-1',
        name: 'Imported List',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      data.tasks.push({
        id: 'imported-task-1',
        title: 'Imported Task',
        priority: 'medium',
        completed: false,
        listId: 'imported-list-1',
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const result = await db.importJSON(data);
      expect(result.listsImported).toBe(1);
      expect(result.tasksImported).toBe(1);
    });

    it('skips existing records (idempotent)', async () => {
      const data = await db.exportAll();
      await db.importJSON(data);
      const result2 = await db.importJSON(data);
      expect(result2.listsImported).toBe(0);
      expect(result2.tasksImported).toBe(0);
    });

    it('rejects orphaned tasks', async () => {
      const data = await db.exportAll();
      data.tasks.push({
        id: 'orphaned-task',
        title: 'Orphan',
        listId: 'nonexistent-list',
        priority: 'none',
        completed: false,
        order: 0,
      });

      await expect(db.importJSON(data)).rejects.toThrow('references unknown list');
    });

    it('rejects unsupported version', async () => {
      const payload = {
        version: 2,
        exportedAt: new Date().toISOString(),
        lists: [],
        tasks: [],
      };
      await expect(db.importJSON(payload as never)).rejects.toThrow('Unsupported format version');
    });

    it('rejects invalid root shape', async () => {
      await expect(db.importJSON({} as never)).rejects.toThrow();
      await expect(db.importJSON({ version: 1 } as never)).rejects.toThrow('Invalid format');
    });

    it('rejects too many lists', async () => {
      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        lists: Array.from({ length: 1001 }, (_, i) => ({
          id: `l${i}`,
          name: `List ${i}`,
          isDefault: i === 0,
        })),
        tasks: [],
      };
      await expect(db.importJSON(payload as ExportData)).rejects.toThrow('Too many records');
    });

    it('rejects too many tasks', async () => {
      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        lists: [{ id: 'l1', name: 'Test', isDefault: true }],
        tasks: Array.from({ length: 10001 }, (_, i) => ({
          id: `t${i}`,
          title: `Task ${i}`,
          listId: 'l1',
          priority: 'none',
          completed: false,
          order: i,
        })),
      };
      await expect(db.importJSON(payload as ExportData)).rejects.toThrow('Too many records');
    });

    it('rejects invalid priority', async () => {
      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        lists: [{ id: 'l1', name: 'Test', isDefault: true }],
        tasks: [{ id: 't1', title: 'Test Task', listId: 'l1', priority: 'urgent', completed: false, order: 0 }],
      };
      await expect(db.importJSON(payload as ExportData)).rejects.toThrow('invalid priority');
    });

    it('rejects malformed due date', async () => {
      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        lists: [{ id: 'l1', name: 'Test', isDefault: true }],
        tasks: [{ id: 't1', title: 'Test Task', listId: 'l1', priority: 'none', completed: false, order: 0, dueDate: 'not-a-date' }],
      };
      await expect(db.importJSON(payload as ExportData)).rejects.toThrow('invalid due date');
    });

    it('rejects control characters in title', async () => {
      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        lists: [{ id: 'l1', name: 'Test', isDefault: true }],
        tasks: [{ id: 't1', title: 'Test Bad', listId: 'l1', priority: 'none', completed: false, order: 0 }],
      };
      await expect(db.importJSON(payload as ExportData)).rejects.toThrow();
    });

    it('performs mid-batch rollback on error', async () => {
      const list = await db.ensureDefaultList();
      await db.createTask({ title: 'Existing task', listId: list.id });

      const payload = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        lists: [{ id: 'l2', name: 'New List', isDefault: false }],
        tasks: [
          { id: 'valid-task', title: 'Valid task', listId: 'l2', priority: 'none', completed: false, order: 0 },
          { id: 'bad-task', title: 'Bad task', listId: 'nonexistent-list', priority: 'none', completed: false, order: 1 },
        ],
      };

      await expect(db.importJSON(payload as ExportData)).rejects.toThrow('references unknown list');

      const allTasks = await db.tasks.toArray();
      expect(allTasks).toHaveLength(1);
      expect(allTasks[0]!.title).toBe('Existing task');
    });
  });

  describe('deleteAllData', () => {
    it('clears all data and recreates default list', async () => {
      await db.ensureDefaultList();
      await db.createList('Extra');
      await db.deleteAllData();

      const lists = await db.lists.toArray();
      const tasks = await db.tasks.toArray();
      expect(lists.length).toBe(1);
      expect(lists[0]!.isDefault).toBe(true);
      expect(tasks.length).toBe(0);
    });
  });
});
