import { computed } from '@preact/signals';
import { tasks, tasksLoading, tasksError } from '@/stores/taskStore.ts';
import { activeFilter, activeSort, sortDirection } from '@/stores/uiStore.ts';
import { lists, listStats, currentListId } from '@/stores/listStore.ts';
import type { Task } from '@/db/todo-schema.ts';

// --- Filtered tasks ---

export const filteredTasks = computed(() => {
  const allTasks = tasks.value;
  const filter = activeFilter.value;

  switch (filter) {
    case 'active':
      return allTasks.filter((t) => !t.completed);
    case 'completed':
      return allTasks.filter((t) => t.completed);
    default:
      return allTasks;
  }
});

// --- Sorted tasks (visible tasks) ---

export const visibleTasks = computed(() => {
  const filtered = [...filteredTasks.value];
  const sort = activeSort.value;
  const dir = sortDirection.value;

  switch (sort) {
    case 'manual':
      return filtered.sort((a, b) => a.order - b.order);
    case 'dueDate': {
      const sorted = filtered.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      return dir === 'desc' ? sorted.reverse() : sorted;
    }
    case 'createdAt': {
      const sorted = filtered.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      return dir === 'desc' ? sorted.reverse() : sorted;
    }
    case 'priority': {
      const priorityOrder: Record<Task['priority'], number> = {
        high: 0,
        medium: 1,
        low: 2,
        none: 3,
      };
      const sorted = filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      return dir === 'desc' ? sorted.reverse() : sorted;
    }
    default:
      return filtered;
  }
});

// --- Lists with counts ---

export const listsWithCounts = computed(() => {
  return lists.value.map((list) => {
    const stats = listStats.value.get(list.id);
    return {
      ...list,
      total: stats?.total ?? 0,
      active: stats?.active ?? 0,
      completed: stats?.completed ?? 0,
    };
  });
});

// --- Current list task count for header ---

export const currentListStats = computed(() => {
  if (!currentListId.value) return { total: 0, active: 0, completed: 0 };
  return listStats.value.get(currentListId.value) ?? { total: 0, active: 0, completed: 0 };
});

// Re-export for convenience
export { tasks, tasksLoading, tasksError };
