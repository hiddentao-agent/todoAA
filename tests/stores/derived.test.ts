import { describe, it, expect, beforeEach } from 'vitest';
import { tasks } from '@/stores/taskStore.ts';
import { lists, listStats, currentListId } from '@/stores/listStore.ts';
import { activeFilter, activeSort, sortDirection } from '@/stores/uiStore.ts';
import {
  filteredTasks,
  visibleTasks,
  listsWithCounts,
  currentListStats,
} from '@/stores/derived.ts';
import type { Task, List, ListStats } from '@/db/todo-schema.ts';

/* ------------------------------------------------------------------ */
/*  Factory helpers                                                    */
/* ------------------------------------------------------------------ */

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Test',
    description: null,
    dueDate: null,
    priority: 'none',
    completed: false,
    createdAt: '2026-06-29T00:00:00Z',
    updatedAt: '2026-06-29T00:00:00Z',
    listId: 'l1',
    order: 0,
    ...overrides,
  };
}

function makeList(overrides: Partial<List> = {}): List {
  return {
    id: 'l1',
    name: 'Default',
    isDefault: true,
    createdAt: '2026-06-29T00:00:00Z',
    updatedAt: '2026-06-29T00:00:00Z',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Reset signals before each test                                     */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  tasks.value = [];
  lists.value = [];
  listStats.value = new Map();
  currentListId.value = null;
  activeFilter.value = 'all';
  activeSort.value = 'manual';
  sortDirection.value = 'asc';
});

/* ------------------------------------------------------------------ */
/*  filteredTasks — computed from tasks + activeFilter                 */
/* ------------------------------------------------------------------ */

describe('filteredTasks', () => {
  const sampleTasks: Task[] = [
    makeTask({ id: '1', title: 'Active task', completed: false }),
    makeTask({ id: '2', title: 'Done task', completed: true }),
    makeTask({ id: '3', title: 'Also active', completed: false }),
  ];

  beforeEach(() => {
    tasks.value = sampleTasks;
  });

  it('returns all tasks when filter is "all"', () => {
    activeFilter.value = 'all';
    expect(filteredTasks.value).toHaveLength(3);
  });

  it('returns only active (non-completed) tasks when filter is "active"', () => {
    activeFilter.value = 'active';
    const result = filteredTasks.value;
    expect(result).toHaveLength(2);
    expect(result.every((t) => !t.completed)).toBe(true);
  });

  it('returns only completed tasks when filter is "completed"', () => {
    activeFilter.value = 'completed';
    const result = filteredTasks.value;
    expect(result).toHaveLength(1);
    expect(result[0]!.completed).toBe(true);
  });

  it('reacts to filter changes', () => {
    expect(filteredTasks.value).toHaveLength(3);
    activeFilter.value = 'active';
    expect(filteredTasks.value).toHaveLength(2);
    activeFilter.value = 'completed';
    expect(filteredTasks.value).toHaveLength(1);
  });

  it('reacts to task signal changes', () => {
    activeFilter.value = 'active';
    expect(filteredTasks.value).toHaveLength(2);

    // Complete the active task
    tasks.value = tasks.value.map((t) =>
      t.id === '1' ? { ...t, completed: true } : t,
    );
    // Now only 1 active task remains
    expect(filteredTasks.value).toHaveLength(1);
    expect(filteredTasks.value[0]!.id).toBe('3');
  });
});

/* ------------------------------------------------------------------ */
/*  visibleTasks — computed from filteredTasks + sort options          */
/* ------------------------------------------------------------------ */

describe('visibleTasks', () => {
  const sampleTasks: Task[] = [
    makeTask({ id: '1', title: 'Second', order: 1, priority: 'low', createdAt: '2026-06-28T00:00:00Z' }),
    makeTask({ id: '2', title: 'First', order: 0, priority: 'high', createdAt: '2026-06-27T00:00:00Z' }),
    makeTask({ id: '3', title: 'Third', order: 2, priority: 'medium', createdAt: '2026-06-29T00:00:00Z' }),
    makeTask({ id: '4', title: 'Done', order: 3, completed: true, priority: 'none', createdAt: '2026-06-30T00:00:00Z' }),
  ];

  beforeEach(() => {
    tasks.value = sampleTasks;
    activeFilter.value = 'all';
    activeSort.value = 'manual';
    sortDirection.value = 'asc';
  });

  it('sorts by manual order (ascending default)', () => {
    const result = visibleTasks.value;
    expect(result[0]!.title).toBe('First');
    expect(result[1]!.title).toBe('Second');
    expect(result[2]!.title).toBe('Third');
    expect(result[3]!.title).toBe('Done');
  });

  it('sorts by dueDate ascending', () => {
    tasks.value = sampleTasks.map((t) => ({ ...t, dueDate: null }));
    // Set specific due dates
    tasks.value = [
      makeTask({ id: '1', title: 'Late', dueDate: '2026-07-02', order: 0 }),
      makeTask({ id: '2', title: 'Early', dueDate: '2026-06-30', order: 1 }),
      makeTask({ id: '3', title: 'Middle', dueDate: '2026-07-01', order: 2 }),
      makeTask({ id: '4', title: 'No date', dueDate: null, order: 3 }),
    ];
    activeSort.value = 'dueDate';

    const result = visibleTasks.value;
    expect(result[0]!.title).toBe('Early');
    expect(result[1]!.title).toBe('Middle');
    expect(result[2]!.title).toBe('Late');
    expect(result[3]!.title).toBe('No date');
  });

  it('ignores sort direction for manual sort', () => {
    activeSort.value = 'manual';
    sortDirection.value = 'desc';

    // Manual sort always returns in ascending order regardless of direction
    const result = visibleTasks.value;
    expect(result[0]!.title).toBe('First');
    expect(result[3]!.title).toBe('Done');
  });

  it('reverses order when sort direction is desc (for non-manual sorts)', () => {
    // Manual sort ignores direction, so use createdAt
    activeSort.value = 'createdAt';
    sortDirection.value = 'desc';

    const result = visibleTasks.value;
    // createdAt asc: 6-27, 6-28, 6-29, 6-30
    // createdAt desc: 6-30, 6-29, 6-28, 6-27
    expect(result[0]!.title).toBe('Done');     // 6-30
    expect(result[3]!.title).toBe('First');     // 6-27
  });

  it('sorts by priority high-to-low (ascending)', () => {
    activeSort.value = 'priority';
    const result = visibleTasks.value;
    expect(result[0]!.priority).toBe('high');
    expect(result[1]!.priority).toBe('medium');
    expect(result[2]!.priority).toBe('low');
    expect(result[3]!.priority).toBe('none');
  });

  it('sorts by priority low-to-high (descending)', () => {
    activeSort.value = 'priority';
    sortDirection.value = 'desc';
    const result = visibleTasks.value;
    expect(result[0]!.priority).toBe('none');
    expect(result[1]!.priority).toBe('low');
    expect(result[2]!.priority).toBe('medium');
    expect(result[3]!.priority).toBe('high');
  });

  it('sorts by createdAt ascending', () => {
    activeSort.value = 'createdAt';
    const result = visibleTasks.value;
    expect(result[0]!.createdAt).toBe('2026-06-27T00:00:00Z');
    expect(result[1]!.createdAt).toBe('2026-06-28T00:00:00Z');
    expect(result[2]!.createdAt).toBe('2026-06-29T00:00:00Z');
    expect(result[3]!.createdAt).toBe('2026-06-30T00:00:00Z');
  });

  it('combines filter and sort', () => {
    activeFilter.value = 'active'; // only non-completed
    activeSort.value = 'priority';

    const result = visibleTasks.value;
    // Only active tasks (non-completed)
    expect(result).toHaveLength(3);
    expect(result.every((t) => !t.completed)).toBe(true);
    expect(result[0]!.priority).toBe('high');
  });

  it('reacts to sort direction changes', () => {
    activeSort.value = 'createdAt';
    sortDirection.value = 'desc';

    const result = visibleTasks.value;
    expect(result[0]!.createdAt).toBe('2026-06-30T00:00:00Z');
    expect(result[3]!.createdAt).toBe('2026-06-27T00:00:00Z');
  });
});

/* ------------------------------------------------------------------ */
/*  listsWithCounts — merges list data with stats                      */
/* ------------------------------------------------------------------ */

describe('listsWithCounts', () => {
  const sampleLists: List[] = [
    makeList({ id: 'l1', name: 'Work' }),
    makeList({ id: 'l2', name: 'Personal', isDefault: false }),
    makeList({ id: 'l3', name: 'Shopping', isDefault: false }),
  ];

  beforeEach(() => {
    lists.value = sampleLists;
  });

  it('returns lists with zero stats when no tasks exist', () => {
    listStats.value = new Map();
    const result = listsWithCounts.value;
    expect(result).toHaveLength(3);
    for (const list of result) {
      expect(list.total).toBe(0);
      expect(list.active).toBe(0);
      expect(list.completed).toBe(0);
    }
  });

  it('merges stats from listStats map', () => {
    const stats = new Map<string, ListStats>();
    stats.set('l1', { total: 5, active: 3, completed: 2 });
    stats.set('l2', { total: 1, active: 0, completed: 1 });
    listStats.value = stats;

    const result = listsWithCounts.value;
    const l1 = result.find((l) => l.id === 'l1')!;
    expect(l1.total).toBe(5);
    expect(l1.active).toBe(3);
    expect(l1.completed).toBe(2);

    const l2 = result.find((l) => l.id === 'l2')!;
    expect(l2.total).toBe(1);
    expect(l2.active).toBe(0);
    expect(l2.completed).toBe(1);
  });

  it('preserves list properties', () => {
    const stats = new Map<string, ListStats>();
    stats.set('l1', { total: 2, active: 1, completed: 1 });
    listStats.value = stats;

    const result = listsWithCounts.value;
    expect(result[0]!.name).toBe('Work');
    expect(result[0]!.isDefault).toBe(true);
    expect(result[0]!.id).toBe('l1');
  });

  it('lists list without stats get zeros', () => {
    // Only provide stats for one list
    const stats = new Map<string, ListStats>();
    stats.set('l1', { total: 10, active: 7, completed: 3 });
    listStats.value = stats;

    const result = listsWithCounts.value;
    // l2 has no stats entry
    const l2 = result.find((l) => l.id === 'l2')!;
    expect(l2.total).toBe(0);
    expect(l2.active).toBe(0);
    expect(l2.completed).toBe(0);
  });

  it('reacts to list changes', () => {
    const stats = new Map<string, ListStats>();
    stats.set('l1', { total: 2, active: 1, completed: 1 });
    listStats.value = stats;

    expect(listsWithCounts.value).toHaveLength(3);

    lists.value = sampleLists.slice(0, 2); // remove Shopping
    expect(listsWithCounts.value).toHaveLength(2);
  });

  it('reacts to stats changes', () => {
    listStats.value = new Map();
    expect(listsWithCounts.value.every((l) => l.total === 0)).toBe(true);

    const stats = new Map<string, ListStats>();
    stats.set('l1', { total: 3, active: 1, completed: 2 });
    listStats.value = stats;

    expect(listsWithCounts.value.find((l) => l.id === 'l1')!.total).toBe(3);
  });
});

/* ------------------------------------------------------------------ */
/*  currentListStats — stats for the active list                       */
/* ------------------------------------------------------------------ */

describe('currentListStats', () => {
  const sampleLists: List[] = [
    makeList({ id: 'l1', name: 'Work' }),
    makeList({ id: 'l2', name: 'Personal', isDefault: false }),
  ];

  beforeEach(() => {
    lists.value = sampleLists;
  });

  it('returns empty stats when no list is selected', () => {
    currentListId.value = null;
    expect(currentListStats.value).toEqual({ total: 0, active: 0, completed: 0 });
  });

  it('returns stats for the current list', () => {
    const stats = new Map<string, ListStats>();
    stats.set('l1', { total: 10, active: 4, completed: 6 });
    stats.set('l2', { total: 3, active: 2, completed: 1 });
    listStats.value = stats;
    currentListId.value = 'l1';

    expect(currentListStats.value).toEqual({ total: 10, active: 4, completed: 6 });
  });

  it('returns empty stats when current list has no stats entry', () => {
    listStats.value = new Map(); // empty map
    currentListId.value = 'l1';

    expect(currentListStats.value).toEqual({ total: 0, active: 0, completed: 0 });
  });

  it('reacts to currentListId changes', () => {
    const stats = new Map<string, ListStats>();
    stats.set('l1', { total: 5, active: 3, completed: 2 });
    stats.set('l2', { total: 1, active: 0, completed: 1 });
    listStats.value = stats;

    currentListId.value = 'l1';
    expect(currentListStats.value.total).toBe(5);

    currentListId.value = 'l2';
    expect(currentListStats.value.total).toBe(1);

    currentListId.value = null;
    expect(currentListStats.value.total).toBe(0);
  });

  it('reacts to listStats changes', () => {
    currentListId.value = 'l1';

    listStats.value = new Map();
    expect(currentListStats.value.total).toBe(0);

    const stats = new Map<string, ListStats>();
    stats.set('l1', { total: 7, active: 5, completed: 2 });
    listStats.value = stats;
    expect(currentListStats.value.total).toBe(7);
  });

  it('visibleTasks returns empty filtered array for unknown sort mode', async () => {
    // Set an unknown sort mode to trigger the default case
    const { activeSort, sortDirection } = await import('@/stores/uiStore.ts');
    activeSort.value = 'unknown' as any;
    sortDirection.value = 'asc';
    const { visibleTasks } = await import('@/stores/derived.ts');
    expect(visibleTasks.value).toEqual([]);
  });
});
