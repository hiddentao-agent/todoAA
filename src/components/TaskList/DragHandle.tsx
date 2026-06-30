import { GripIcon } from '@/components/Icons/Icons.tsx';
import styles from './DragHandle.module.css';

interface DragHandleProps {
  visible: boolean;
}

/*
 * DragHandle — a grip icon used as the drag initiation point.
 * Marked with data-drag-handle so @formkit/drag-and-drop can
 * restrict dragging to this element only.
 *
 * When !visible (sort mode != 'manual'), renders an empty
 * placeholder to preserve alignment.
 */
export function DragHandle({ visible }: DragHandleProps) {
  if (!visible) {
    return <div class={styles.placeholder} />;
  }

  return (
    <button
      class={styles.handle}
      type="button"
      data-drag-handle
      aria-label="Drag to reorder"
      aria-roledescription="sortable"
    >
      <GripIcon size={18} />
    </button>
  );
}
