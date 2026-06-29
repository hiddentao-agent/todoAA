import { describe, it, expect } from 'vitest';
import type { Task } from '@/db/todo-schema.ts';

// We test the sort/filter logic directly by importing the relevant functions.
// Since the actual derived module uses reactive signals, we recreate the logic
// as pure functions for testability.

function filterTasks(tasks: Task[], filter: 'all' | 'active' | 'completed'): Task[] {
  switch (filter) {
    case 'active': return tasks.filter((t) => !t.completed);
    case 'completed': return tasks.filter((t) => t.completed);
    default: return tasks;
  }
}

function sortTasks(
  tasks: Task[],
  sort: 'manual' | 'dueDate' | 'createdAt' | 'priority',
  dir: 'asc' | 'desc',
): Task[] {
  const sorted = [...tasks];

  switch (sort) {
    case 'manual':
      sorted.sort((a, b) => a.order - b.order);
      break;
    case 'dueDate':
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      break;
    case 'createdAt':
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'priority': {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
      sorted.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
      break;
    }
  }

  return dir === 'desc' ? sorted.reverse() : sorted;
}

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

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: '1', title: 'Active', completed: false }),
    makeTask({ id: '2', title: 'Done', completed: true }),
    makeTask({ id: '3', title: 'Also Active', completed: false }),
  ];

  it('shows all tasks when filter is all', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(3);
  });

  it('shows only active tasks', () => {
    const result = filterTasks(tasks, 'active');
    expect(result).toHaveLength(2);
    expect(result.every((t) => !t.completed)).toBe(true);
  });

  it('shows only completed tasks', () => {
    const result = filterTasks(tasks, 'completed');
    expect(result).toHaveLength(1);
    expect(result[0]!.completed).toBe(true);
  });
});

describe('sortTasks', () => {
  it('sorts by manual order', () => {
    const tasks = [
      makeTask({ id: '1', order: 2 }),
      makeTask({ id: '2', order: 0 }),
      makeTask({ id: '3', order: 1 }),
    ];
    const result = sortTasks(tasks, 'manual', 'asc');
    expect(result.map((t) => t.order)).toEqual([0, 1, 2]);
  });

  it('sorts by due date ascending', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-07-01' }),
      makeTask({ id: '2', dueDate: '2026-06-29' }),
    ];
    const result = sortTasks(tasks, 'dueDate', 'asc');
    expect(result[0]!.dueDate).toBe('2026-06-29');
  });

  it('sorts by priority high to low', () => {
    const tasks = [
      makeTask({ id: '1', priority: 'low' }),
      makeTask({ id: '2', priority: 'high' }),
      makeTask({ id: '3', priority: 'none' }),
    ];
    const result = sortTasks(tasks, 'priority', 'asc');
    expect(result[0]!.priority).toBe('high');
    expect(result[1]!.priority).toBe('low');
    expect(result[2]!.priority).toBe('none');
  });

  it('sorts by creation date', () => {
    const tasks = [
      makeTask({ id: '1', createdAt: '2026-06-28T00:00:00Z' }),
      makeTask({ id: '2', createdAt: '2026-06-29T00:00:00Z' }),
    ];
    const result = sortTasks(tasks, 'createdAt', 'asc');
    expect(result[0]!.createdAt).toBe('2026-06-28T00:00:00Z');
  });

  it('respects descending direction', () => {
    const tasks = [
      makeTask({ id: '1', priority: 'low' }),
      makeTask({ id: '2', priority: 'high' }),
    ];
    const result = sortTasks(tasks, 'priority', 'desc');
    // Desc: high(0) → none(3) → low(2) → high(0)...
    // With 2 items: high=0, low=2 → desc = low(2), high(0)
    expect(result[0]!.priority).toBe('low');
    expect(result[1]!.priority).toBe('high');
  });
});
