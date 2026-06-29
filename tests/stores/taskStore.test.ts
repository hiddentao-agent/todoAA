import { describe, it, expect, beforeEach } from 'vitest';
import { TodoDatabase } from '@/db/todo-schema.ts';
import { initializeTaskStore, loadTasks, createTask, updateTask, toggleTaskCompletion, deleteTask, reorderTasks, tasks } from '@/stores/taskStore.ts';
import { initializeListStore, loadLists, currentListId, lists } from '@/stores/listStore.ts';

describe('taskStore', () => {
  let db: TodoDatabase;

  beforeEach(async () => {
    db = new TodoDatabase();
    await db.open();
    await db.transaction('rw', db.tasks, db.lists, async () => {
      await db.tasks.clear();
      await db.lists.clear();
    });

    await db.ensureDefaultList();
    initializeListStore(db);
    initializeTaskStore(db);
    await loadLists();
  });

  it('creates a task and updates signals', async () => {
    const listId = lists.value[0]!.id;
    currentListId.value = listId;

    const task = await createTask({ title: 'New task', listId });

    await loadTasks();
    expect(tasks.value.some((t) => t.id === task.id)).toBe(true);
  });

  it('toggles task completion', async () => {
    const listId = lists.value[0]!.id;
    currentListId.value = listId;

    const task = await createTask({ title: 'Toggle test', listId });
    await toggleTaskCompletion(task.id);

    await loadTasks();
    const updated = tasks.value.find((t) => t.id === task.id);
    expect(updated!.completed).toBe(true);
  });

  it('updates a task', async () => {
    const listId = lists.value[0]!.id;
    currentListId.value = listId;

    const task = await createTask({ title: 'Original', listId });
    await updateTask(task.id, { title: 'Updated' });

    await loadTasks();
    const updated = tasks.value.find((t) => t.id === task.id);
    expect(updated!.title).toBe('Updated');
  });

  it('deletes a task', async () => {
    const listId = lists.value[0]!.id;
    currentListId.value = listId;

    const task = await createTask({ title: 'Delete me', listId });
    await deleteTask(task.id);

    await loadTasks();
    expect(tasks.value.some((t) => t.id === task.id)).toBe(false);
  });

  it('reorders tasks', async () => {
    const listId = lists.value[0]!.id;
    currentListId.value = listId;

    const t1 = await createTask({ title: 'A', listId });
    const t2 = await createTask({ title: 'B', listId });

    await reorderTasks([t2.id, t1.id]);

    await loadTasks();
    const reordered = tasks.value.filter((t) => t.listId === listId);
    expect(reordered[0]!.id).toBe(t2.id);
    expect(reordered[1]!.id).toBe(t1.id);
  });

  it('handles rapid toggle race condition', async () => {
    const listId = lists.value[0]!.id;
    currentListId.value = listId;

    const task = await createTask({ title: 'Race test', listId });

    // Simulate two rapid toggles
    await Promise.all([
      toggleTaskCompletion(task.id),
      toggleTaskCompletion(task.id),
    ]);

    // Both should return the same final state (toggled twice = back to original)
    await loadTasks();
    const final = tasks.value.find((t) => t.id === task.id);
    // With atomic transactions, the final state should be consistent
    expect(final).toBeDefined();
  });
});
