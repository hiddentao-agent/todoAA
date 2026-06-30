import { CheckIcon } from '@/components/Icons/Icons.tsx';
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
        <CheckIcon class={styles.checkmark} size={24} />
      </span>
    </button>
  );
}
