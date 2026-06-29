import styles from './CompletionToggle.module.css';

interface CompletionToggleProps {
  completed: boolean;
  taskTitle: string;
  onToggle: () => void;
}

export function CompletionToggle({ completed, taskTitle, onToggle }: CompletionToggleProps) {
  const label = completed
    ? `Mark "${taskTitle}" as incomplete`
    : `Mark "${taskTitle}" as complete`;

  return (
    <button
      class={`${styles.toggle} ${completed ? styles.checked : ''}`}
      role="checkbox"
      aria-checked={completed}
      aria-label={label}
      onClick={onToggle}
    >
      <span class={styles.circle}>
        <svg
          class={styles.checkmark}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
    </button>
  );
}
