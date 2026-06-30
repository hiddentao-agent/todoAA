import { CompletionToggle } from './CompletionToggle.tsx';
import { DragHandle } from './DragHandle.tsx';
import { openTaskForm, activeSort } from '@/stores/uiStore.ts';
import { toggleTaskCompletion } from '@/stores/taskStore.ts';
import { getDueDateStatus, formatDate } from '@/utils/date.ts';
import type { Task } from '@/db/todo-schema.ts';
import { EditIcon, TrashIcon } from '@/components/Icons/Icons.tsx';
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

  const isManualSort = activeSort.value === 'manual';

  return (
    <div
      class={`${styles.item} ${task.completed ? styles.completed : ''}`}
      role="listitem"
      data-task-id={task.id}
    >
      <DragHandle visible={isManualSort} />
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
          <EditIcon size={18} />
        </button>
        <button
          class={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={handleDelete}
          aria-label={`Delete task: ${task.title}`}
        >
          <TrashIcon size={18} />
        </button>
      </div>
    </div>
  );
}
