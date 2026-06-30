import { useEffect, useRef } from 'preact/hooks';
import { dragAndDrop, tearDown, updateConfig } from '@formkit/drag-and-drop';
import { activeSort } from '@/stores/uiStore.ts';
import { reorderTasks } from '@/stores/taskStore.ts';
import { visibleTasks } from '@/stores/derived.ts';
import type { Task } from '@/db/todo-schema.ts';

/*
 * useSortableList — hook that wires @formkit/drag-and-drop to the task list.
 * Provides native drag-and-drop AND keyboard reordering (Arrow keys, Space,
 * Enter to pick up/drop, Escape to cancel) out of the box.
 *
 * Returns a ref to attach to the list container element.
 * Drag-and-drop is only active when sort mode is 'manual'.
 */

const DRAG_HANDLE_SELECTOR = '[data-drag-handle]';

export function useSortableList() {
  const listRef = useRef<HTMLUListElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // Build the task lookup from current signal value at init time.
    // getValues is called on each drag operation, so it always reads current DOM.
    const getValues = (): Task[] => {
      const items = el.querySelectorAll<HTMLElement>('[data-task-id]');
      const taskMap = new Map(visibleTasks.value.map((t) => [t.id, t]));
      return Array.from(items)
        .map((item) => {
          const id = item.dataset.taskId;
          return id ? taskMap.get(id) : undefined;
        })
        .filter((t): t is Task => t != null);
    };

    dragAndDrop<Task>({
      parent: el,
      getValues,
      setValues: (values: Task[]) => {
        void reorderTasks(values.map((t) => t.id));
      },
      config: {
        dragHandle: DRAG_HANDLE_SELECTOR,
        sortable: activeSort.value === 'manual',
      },
    });

    initializedRef.current = true;

    // Watch for sort mode changes to toggle sortable via updateConfig
    const unsubscribe = activeSort.subscribe((newSort) => {
      if (initializedRef.current && el) {
        updateConfig<Task>(el, { sortable: newSort === 'manual' });
      }
    });

    return () => {
      unsubscribe();
      if (el) {
        tearDown(el);
        initializedRef.current = false;
      }
    };
  }, []);

  return listRef;
}
