import { ClipboardIcon, SearchIcon } from '@/components/Icons/Icons.tsx';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  type: 'no-tasks' | 'no-results';
  onCreateTask?: () => void;
  onClearFilter?: () => void;
}

export function EmptyState({ type, onCreateTask, onClearFilter }: EmptyStateProps) {
  return (
    <div class={styles.container} role="status">
      <div class={styles.iconCircle}>
        {type === 'no-tasks' ? (
          <ClipboardIcon size={40} />
        ) : (
          <SearchIcon size={40} />
        )}
      </div>
      <h3 class={styles.heading}>
        {type === 'no-tasks' ? 'No tasks yet' : 'No results'}
      </h3>
      <p class={styles.message}>
        {type === 'no-tasks'
          ? 'Create your first task to get started.'
          : 'No tasks match the current filter.'}
      </p>
      {type === 'no-tasks' && onCreateTask && (
        <button class={styles.cta} onClick={onCreateTask}>
          Create Task
        </button>
      )}
      {type === 'no-results' && onClearFilter && (
        <button class={styles.secondaryCta} onClick={onClearFilter}>
          Clear filter
        </button>
      )}
    </div>
  );
}
