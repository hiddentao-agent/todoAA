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
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
        <circle cx="4" cy="4" r="1.5" />
        <circle cx="10" cy="4" r="1.5" />
        <circle cx="4" cy="9" r="1.5" />
        <circle cx="10" cy="9" r="1.5" />
        <circle cx="4" cy="14" r="1.5" />
        <circle cx="10" cy="14" r="1.5" />
      </svg>
    </button>
  );
}
