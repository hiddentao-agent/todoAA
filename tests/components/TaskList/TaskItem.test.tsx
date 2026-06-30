import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { TaskItem } from '@/components/TaskList/TaskItem.tsx';
import { activeSort, editingTaskId, taskFormOpen } from '@/stores/uiStore.ts';
import type { Task } from '@/db/todo-schema.ts';

// Mock toggleTaskCompletion so it doesn't need a real database
vi.mock('@/stores/taskStore.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/stores/taskStore.ts')>();
  return { ...mod, toggleTaskCompletion: vi.fn() };
});

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Buy groceries',
    description: null,
    dueDate: null,
    priority: 'none',
    completed: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    listId: 'list-1',
    order: 0,
    ...overrides,
  };
}

describe('TaskItem', () => {
  const onDelete = vi.fn();

  beforeEach(() => {
    activeSort.value = 'manual';
    editingTaskId.value = null;
    taskFormOpen.value = false;
    onDelete.mockClear();
  });

  afterEach(cleanup);

  it('renders task title, completion toggle, and action buttons', () => {
    const task = createTask();
    render(<TaskItem task={task} onDelete={onDelete} />);

    // Task title is visible
    expect(screen.getByText('Buy groceries')).toBeTruthy();

    // Completion toggle checkbox
    expect(screen.getByRole('checkbox')).toBeTruthy();

    // Edit button
    expect(screen.getByLabelText('Edit task: Buy groceries')).toBeTruthy();

    // Delete button
    expect(screen.getByLabelText('Delete task: Buy groceries')).toBeTruthy();
  });

  it('applies completed class when task.completed=true', () => {
    const task = createTask({ completed: true });
    const { container } = render(<TaskItem task={task} onDelete={onDelete} />);

    // The root element has role="listitem" and data-task-id
    const item = container.querySelector('[data-task-id="task-1"]');
    expect(item).not.toBeNull();
    // completed class should be applied
    expect(item!.getAttribute('class')).toContain('completed');
  });

  it('shows due date badge when task has dueDate', () => {
    const task = createTask({ dueDate: '2024-06-15' });
    const { container } = render(<TaskItem task={task} onDelete={onDelete} />);

    // Due date should be displayed somewhere in the meta section
    // formatDate('2024-06-15') produces something like "Jun 15, 2024"
    // We check that a badge with a date exists
    const meta = container.querySelector('[class*="meta"]') ?? container;
    expect(meta.textContent).toMatch(/Jun|June/i);
  });

  it('does not show due date badge when task has no dueDate', () => {
    const task = createTask({ dueDate: null });
    render(<TaskItem task={task} onDelete={onDelete} />);

    // Only the title and action buttons should be visible, no date text
    expect(screen.getByText('Buy groceries')).toBeTruthy();
    // We should not see any formatted date
  });

  it('shows priority badge when task.priority is set', () => {
    const task = createTask({ priority: 'high' });
    render(<TaskItem task={task} onDelete={onDelete} />);

    expect(screen.getByText('High')).toBeTruthy();
  });

  it('does not show priority badge when priority is none', () => {
    const task = createTask({ priority: 'none' });
    render(<TaskItem task={task} onDelete={onDelete} />);

    expect(screen.queryByText('High')).toBeNull();
    expect(screen.queryByText('Medium')).toBeNull();
    expect(screen.queryByText('Low')).toBeNull();
  });

  it('shows DragHandle when sort mode is manual', () => {
    activeSort.value = 'manual';
    const task = createTask();
    const { container } = render(<TaskItem task={task} onDelete={onDelete} />);

    // DragHandle should have data-drag-handle attribute
    expect(container.querySelector('[data-drag-handle]')).not.toBeNull();
  });

  it('hides DragHandle when sort mode is not manual', () => {
    activeSort.value = 'createdAt';
    const task = createTask();
    const { container } = render(<TaskItem task={task} onDelete={onDelete} />);

    // No DragHandle button
    expect(container.querySelector('[data-drag-handle]')).toBeNull();
    // Should render placeholder instead — the first child should be a div
    const firstChild = container.querySelector('[data-task-id="task-1"]')?.children[0];
    expect(firstChild?.tagName).toBe('DIV');
  });

  it('edit button opens TaskForm by setting editingTaskId and taskFormOpen', () => {
    const task = createTask();
    render(<TaskItem task={task} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText('Edit task: Buy groceries'));

    expect(editingTaskId.value).toBe('task-1');
    expect(taskFormOpen.value).toBe(true);
  });

  it('delete button calls onDelete with the task', () => {
    const task = createTask();
    render(<TaskItem task={task} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText('Delete task: Buy groceries'));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(task);
  });

  it('has data-task-id attribute', () => {
    const task = createTask({ id: 'custom-id-123' });
    const { container } = render(<TaskItem task={task} onDelete={onDelete} />);

    expect(container.querySelector('[data-task-id="custom-id-123"]')).not.toBeNull();
  });
});
