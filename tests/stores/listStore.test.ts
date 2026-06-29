import { describe, it, expect, beforeEach } from 'vitest';
import { TodoDatabase } from '@/db/todo-schema.ts';
import {
  initializeListStore,
  loadLists,
  createList,
  renameList,
  deleteListCascade,
  selectList,
  lists,
  currentListId,
  defaultList,
} from '@/stores/listStore.ts';

describe('listStore', () => {
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
    await loadLists();
  });

  it('has default list after initialization', () => {
    expect(lists.value.length).toBe(1);
    expect(lists.value[0]!.isDefault).toBe(true);
    expect(lists.value[0]!.name).toBe('My Tasks');
  });

  it('creates a new list', async () => {
    await createList('Work');
    expect(lists.value.length).toBe(2);
    expect(lists.value.some((l) => l.name === 'Work')).toBe(true);
  });

  it('renames a list', async () => {
    const list = await createList('Old Name');
    await renameList(list.id, 'New Name');
    const updated = lists.value.find((l) => l.id === list.id);
    expect(updated!.name).toBe('New Name');
  });

  it('prevents deleting the default list', async () => {
    const defaultId = defaultList.value!.id;
    await expect(deleteListCascade(defaultId)).rejects.toThrow('Cannot delete the default list');
  });

  it('cascade-deletes a list and its tasks', async () => {
    const list = await createList('Shopping');
    // Create a task in that list via DB directly
    await db.createTask({ title: 'Buy milk', listId: list.id });
    await loadLists();

    await deleteListCascade(list.id);
    expect(lists.value.some((l) => l.id === list.id)).toBe(false);
    const tasks = await db.tasks.where('listId').equals(list.id).toArray();
    expect(tasks).toHaveLength(0);
  });

  it('selectList updates currentListId', () => {
    const listId = lists.value[0]!.id;
    selectList(listId);
    expect(currentListId.value).toBe(listId);
  });

  it('persists currentListId to localStorage', () => {
    const listId = lists.value[0]!.id;
    selectList(listId);
    expect(localStorage.getItem('todo-current-list')).toBe(listId);
  });

  it('switches to first list when deleting the current list', async () => {
    const newList = await createList('Extra');
    selectList(newList.id);
    expect(currentListId.value).toBe(newList.id);

    await deleteListCascade(newList.id);
    expect(currentListId.value).toBe(lists.value[0]!.id);
  });
});
