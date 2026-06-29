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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
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
