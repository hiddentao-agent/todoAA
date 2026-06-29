import { useState, useCallback } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { activeSort, showToast } from '@/stores/uiStore.ts';
import { visibleTasks } from '@/stores/derived.ts';

interface DragState {
  dragIndex: number | null;
  overIndex: number | null;
}

export function useDragAndDrop(onReorder: (ids: string[]) => Promise<void>) {
  const [dragState, setDragState] = useState<DragState>({
    dragIndex: null,
    overIndex: null,
  });

  const sortMode = useComputed(() => activeSort.value);
  const isManual = sortMode.value === 'manual';

  const handleDragStart = useCallback(
    (e: DragEvent, index: number) => {
      if (!isManual) return;
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', String(index));
      setDragState({ dragIndex: index, overIndex: null });

      requestAnimationFrame(() => {
        const el = e.target as HTMLElement;
        el.classList.add('dragging');
      });
    },
    [isManual],
  );

  const handleDragOver = useCallback(
    (e: DragEvent, index: number) => {
      if (!isManual) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      setDragState((prev: DragState) => ({ ...prev, overIndex: index }));
    },
    [isManual],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      if (!isManual) return;
      const target = e.currentTarget as HTMLElement;
      if (!target.contains(e.relatedTarget as Node)) {
        setDragState((prev: DragState) => ({ ...prev, overIndex: null }));
      }
    },
    [isManual],
  );

  const handleDrop = useCallback(
    async (e: DragEvent, index: number) => {
      if (!isManual) return;
      e.preventDefault();

      const fromIndex = Number(e.dataTransfer!.getData('text/plain'));
      if (isNaN(fromIndex) || fromIndex === index) {
        setDragState({ dragIndex: null, overIndex: null });
        return;
      }

      const tasks = [...visibleTasks.value];
      const [moved] = tasks.splice(fromIndex, 1);
      tasks.splice(index, 0, moved!);

      try {
        await onReorder(tasks.map((t) => t.id));
        showToast('Task reordered');
      } catch {
        showToast('Failed to reorder');
      }

      setDragState({ dragIndex: null, overIndex: null });
    },
    [isManual, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragState({ dragIndex: null, overIndex: null });
  }, []);

  return {
    dragState,
    isManual,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
