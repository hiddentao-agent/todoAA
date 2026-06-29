import { CompletionToggle } from './CompletionToggle.tsx';
import { openTaskForm } from '@/stores/uiStore.ts';
import { toggleTaskCompletion } from '@/stores/taskStore.ts';
import { getDueDateStatus, formatDate } from '@/utils/date.ts';
import type { Task } from '@/db/todo-schema.ts';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onDelete: (task: Task) => void;
}

const DUE_DATE_CLASSES: Record<string, string | undefined> = {
  overdue: styles.dueDateOverdue,
  today: styles.dueDateToday,
  tomorrow: styles.dueDateTomorrow,
  upcoming: styles.dueDateUpcoming,
  later: styles.dueDateLater,
};

const PRIORITY_CLASSES: Record<string, string | undefined> = {
  high: styles.priorityHigh,
  medium: styles.priorityMedium,
  low: styles.priorityLow,
};

export function TaskItem({ task, onDelete }: TaskItemProps) {
  const dueStatus = task.dueDate ? getDueDateStatus(new Date(task.dueDate)) : null;
  const dueClass = dueStatus ? DUE_DATE_CLASSES[dueStatus] ?? '' : '';
  const priorityClass = task.priority !== 'none' ? PRIORITY_CLASSES[task.priority] ?? '' : '';

  const handleToggle = async () => {
    await toggleTaskCompletion(task.id);
  };

  const handleEdit = () => {
    openTaskForm(task.id);
  };

  const handleDelete = () => {
    onDelete(task);
  };

  return (
    <div class={`${styles.item} ${task.completed ? styles.completed : ''}`} role="listitem">
      <CompletionToggle
        completed={task.completed}
        taskTitle={task.title}
        onToggle={handleToggle}
      />
      <div class={styles.content}>
        <div class={styles.titleRow}>
          <span class={styles.title}>{task.title}</span>
        </div>
        <div class={styles.meta}>
          {dueStatus && (
            <span class={`${styles.badge} ${dueClass}`}>
              {formatDate(task.dueDate!)}
            </span>
          )}
          {task.priority !== 'none' && (
            <span class={styles.badge}>
              <span class={`${styles.priorityDot} ${priorityClass}`} />
              <span class={styles.priorityLabel}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </span>
          )}
        </div>
      </div>
      <div class={styles.actions}>
        <button class={styles.actionBtn} onClick={handleEdit} aria-label={`Edit task: ${task.title}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          class={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={handleDelete}
          aria-label={`Delete task: ${task.title}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
