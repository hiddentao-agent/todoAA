import { useState } from 'preact/hooks';
import { visibleTasks, tasks, tasksLoading, tasksError } from '@/stores/derived.ts';
import { openTaskForm, setFilter } from '@/stores/uiStore.ts';
import { deleteTask, loadTasks } from '@/stores/taskStore.ts';
import { TaskItem } from './TaskItem.tsx';
import { EmptyState } from '@/components/shared/EmptyState.tsx';
import { ErrorBanner } from '@/components/shared/ErrorBanner.tsx';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.tsx';
import type { Task } from '@/db/todo-schema.ts';
import styles from './TaskListView.module.css';

export function TaskListView() {
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const handleDelete = (task: Task) => {
    setDeleteTarget(task);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteTask(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleRetry = async () => {
    await loadTasks();
  };

  // Loading state
  if (tasksLoading.value) {
    return (
      <div role="progressbar" aria-label="Loading tasks" aria-busy="true">
        <div class={styles.skeletonList}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} class={styles.skeletonRow}>
              <div class={styles.skeletonCircle} />
              <div class={styles.skeletonContent}>
                <div class={styles.skeletonBar} style={{ width: `${60 + i * 8}%` }} />
                <div class={styles.skeletonBarShort} style={{ width: `${30 + i * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (tasksError.value) {
    return (
      <ErrorBanner
        message={tasksError.value}
        action={{ label: 'Retry', onClick: handleRetry }}
      />
    );
  }

  // Empty state — no tasks at all
  if (tasks.value.length === 0) {
    return (
      <EmptyState
        type="no-tasks"
        onCreateTask={() => openTaskForm()}
      />
    );
  }

  // Empty state — no tasks match filter
  if (visibleTasks.value.length === 0) {
    return (
      <EmptyState
        type="no-results"
        onClearFilter={() => setFilter('all')}
      />
    );
  }

  return (
    <>
      <ul class={styles.list} role="list" aria-label="Tasks">
        {visibleTasks.value.map((task) => (
          <TaskItem key={task.id} task={task} onDelete={handleDelete} />
        ))}
      </ul>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this task?"
          message="This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
