import { GripIcon } from '@/components/Icons/Icons.tsx';
import styles from './DragHandle.module.css';

interface DragHandleProps {
  index: number;
  onDragStart: (e: DragEvent, index: number) => void;
  visible: boolean;
}

export function DragHandle({ index, onDragStart, visible }: DragHandleProps) {
  if (!visible) {
    return <div class={styles.placeholder} />;
  }

  return (
    <button
      class={styles.handle}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      aria-label="Drag to reorder"
      aria-roledescription="sortable"
    >
      <GripIcon size={18} />
    </button>
  );
}
