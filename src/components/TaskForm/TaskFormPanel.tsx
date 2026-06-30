import { useState, useEffect } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { useFocusTrap } from '@/hooks/useFocusTrap.ts';
import { taskFormOpen, editingTaskId, closeTaskForm, showToast } from '@/stores/uiStore.ts';
import { visibleTasks } from '@/stores/derived.ts';
import { lists } from '@/stores/listStore.ts';
import { createTask, updateTask } from '@/stores/taskStore.ts';
import { sanitizeString } from '@/utils/sanitize.ts';
import { CloseIcon } from '@/components/Icons/Icons.tsx';
import styles from './TaskFormPanel.module.css';

const PRIORITIES = ['none', 'low', 'medium', 'high'] as const;

export function TaskFormPanel() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [listId, setListId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    closeTaskForm();
  };

  const trapRef = useFocusTrap(taskFormOpen.value, handleClose);

  const editingTask = useComputed(() => {
    if (!editingTaskId.value) return undefined;
    return visibleTasks.value.find((t) => t.id === editingTaskId.value);
  });

  useEffect(() => {
    const task = editingTask.value;
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setDueDate(task.dueDate?.split('T')[0] ?? '');
      setPriority(task.priority);
      setListId(task.listId);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('none');
      setListId(lists.value[0]?.id ?? '');
    }
    setErrors({});
    setSubmitting(false);
  }, [editingTaskId.value, taskFormOpen.value]);

  const dirty = title.trim().length > 0 || description.trim().length > 0;

  const handleOverlayClick = () => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    handleClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    try {
      const sanitized = sanitizeString(title);
      if (!sanitized) {
        newErrors.title = 'Title is required';
      } else if (sanitized.length > 500) {
        newErrors.title = 'Title must be 500 characters or less';
      }
    } catch {
      newErrors.title = 'Title contains invalid characters';
    }

    if (description) {
      try {
        const sanitized = sanitizeString(description);
        if (sanitized.length > 5000) {
          newErrors.description = 'Description must be 5000 characters or less';
        }
      } catch {
        newErrors.description = 'Description contains invalid characters';
      }
    }

    if (dueDate && isNaN(new Date(dueDate).getTime())) {
      newErrors.dueDate = 'Invalid date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const task = editingTask.value;
      if (task) {
        await updateTask(task.id, {
          title,
          description: description || null,
          dueDate: dueDate || null,
          priority,
          listId,
        });
        showToast('Task saved');
      } else {
        await createTask({
          title,
          description: description || null,
          dueDate: dueDate || null,
          priority,
          listId: listId || lists.value[0]?.id || '',
        });
        showToast('Task created');
      }
      handleClose();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save task' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!taskFormOpen.value) return null;

  return (
    <>
      <div class={styles.overlay} onClick={handleOverlayClick} aria-hidden="true" />
      <div
        class={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        ref={trapRef}
      >
        <div class={styles.header}>
          <h2 class={styles.title} id="form-title">
            {editingTask.value ? 'Edit Task' : 'New Task'}
          </h2>
          <button class={styles.closeBtn} onClick={handleClose} aria-label="Close">
            <CloseIcon size={24} />
          </button>
        </div>
        <form class={styles.body} onSubmit={handleSubmit}>
          <div class={styles.field}>
            <label class={styles.label} for="task-title">
              Title <span class={styles.required}>*</span>
            </label>
            <input
              id="task-title"
              class={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              type="text"
              value={title}
              onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
              placeholder="What needs to be done?"
              maxLength={500}
              autofocus
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && <span class={styles.errorText} id="title-error">{errors.title}</span>}
          </div>

          <div class={styles.field}>
            <label class={styles.label} for="task-description">Description</label>
            <textarea
              id="task-description"
              class={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              value={description}
              onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              placeholder="Add details..."
              maxLength={5000}
              rows={3}
              aria-describedby={errors.description ? 'desc-error' : undefined}
            />
            {errors.description && <span class={styles.errorText} id="desc-error">{errors.description}</span>}
          </div>

          <div class={styles.field}>
            <label class={styles.label} for="task-due-date">Due Date</label>
            <input
              id="task-due-date"
              class={`${styles.input} ${errors.dueDate ? styles.inputError : ''}`}
              type="date"
              value={dueDate}
              onInput={(e) => setDueDate((e.target as HTMLInputElement).value)}
              aria-describedby={errors.dueDate ? 'due-error' : undefined}
            />
            {errors.dueDate && <span class={styles.errorText} id="due-error">{errors.dueDate}</span>}
          </div>

          <div class={styles.field}>
            <label class={styles.label} for="task-priority">Priority</label>
            <select
              id="task-priority"
              class={styles.select}
              value={priority}
              onChange={(e) => setPriority((e.target as HTMLSelectElement).value as typeof priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div class={styles.field}>
            <label class={styles.label} for="task-list">List</label>
            <select
              id="task-list"
              class={styles.select}
              value={listId}
              onChange={(e) => setListId((e.target as HTMLSelectElement).value)}
            >
              {lists.value.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {errors.submit && (
            <div class={styles.errorText} role="alert">{errors.submit}</div>
          )}
        </form>
        <div class={styles.footer}>
          <button class={styles.cancelBtn} onClick={handleClose} type="button">
            Cancel
          </button>
          <button
            class={styles.saveBtn}
            onClick={handleSubmit}
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Saving...' : editingTask.value ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </>
  );
}
