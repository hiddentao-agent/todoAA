import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { TaskListView } from '@/components/TaskList/TaskListView.tsx';
import { tasks, tasksLoading, tasksError } from '@/stores/derived.ts';
import { activeFilter, activeSort, sortDirection } from '@/stores/uiStore.ts';
import { currentListId, listStats } from '@/stores/listStore.ts';
import { deleteTask, loadTasks } from '@/stores/taskStore.ts';
import type { Task } from '@/db/todo-schema.ts';

// Mock db-dependent functions so they don't throw in tests.
// Static imports above get the mocked (vi.fn()) versions.
vi.mock('@/stores/taskStore.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/stores/taskStore.ts')>();
  return {
    ...mod,
    deleteTask: vi.fn(),
    loadTasks: vi.fn(),
  };
});

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? `task-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Test Task',
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

describe('TaskListView', () => {
  beforeEach(() => {
    // Reset all relevant signals to defaults
    tasks.value = [];
    tasksLoading.value = false;
    tasksError.value = null;
    activeFilter.value = 'all';
    activeSort.value = 'manual';
    sortDirection.value = 'asc';
    currentListId.value = 'list-1';
    listStats.value = new Map([['list-1', { total: 0, active: 0, completed: 0 }]]);
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  // --- Loading state ---

  it('shows loading skeleton when tasksLoading is true', () => {
    tasksLoading.value = true;
    render(<TaskListView />);

    const loader = screen.getByRole('progressbar');
    expect(loader).toBeTruthy();
    expect(loader.getAttribute('aria-label')).toBe('Loading tasks');
    expect(loader.getAttribute('aria-busy')).toBe('true');
  });

  it('does not show skeleton when tasksLoading is false', () => {
    tasksLoading.value = false;
    render(<TaskListView />);

    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  // --- Error state ---

  it('shows error banner with retry button when tasksError is set', () => {
    tasksError.value = 'Failed to load tasks';
    render(<TaskListView />);

    // Error banner has role="alert"
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Failed to load tasks')).toBeTruthy();

    // Retry button should be present
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('retry button calls loadTasks', () => {
    tasksError.value = 'Something went wrong';
    render(<TaskListView />);

    fireEvent.click(screen.getByText('Retry'));

    expect(loadTasks).toHaveBeenCalledOnce();
  });

  // --- Empty states ---

  it('shows no-tasks empty state when tasks array is empty', () => {
    tasks.value = [];
    render(<TaskListView />);

    expect(screen.getByText('No tasks yet')).toBeTruthy();
    expect(screen.getByText('Create your first task to get started.')).toBeTruthy();

    // Create Task button should be present
    expect(screen.getByText('Create Task')).toBeTruthy();
  });

  it('shows no-results empty state when visibleTasks is empty but tasks exist', () => {
    // Set a filter that doesn't match our tasks
    tasks.value = [createTask({ completed: false })];
    activeFilter.value = 'completed';

    render(<TaskListView />);

    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('No tasks match the current filter.')).toBeTruthy();

    // Clear filter button should be present
    expect(screen.getByText('Clear filter')).toBeTruthy();
  });

  it('clear filter resets filter to all', () => {
    tasks.value = [createTask({ completed: false })];
    activeFilter.value = 'completed';

    render(<TaskListView />);

    fireEvent.click(screen.getByText('Clear filter'));

    expect(activeFilter.value).toBe('all');
  });

  // --- Task rendering ---

  it('renders task items when tasks exist and match the filter', () => {
    const task1 = createTask({ id: 't1', title: 'First task' });
    const task2 = createTask({ id: 't2', title: 'Second task' });
    tasks.value = [task1, task2];

    const { container } = render(<TaskListView />);

    // Verify both tasks are rendered
    expect(screen.getByText('First task')).toBeTruthy();
    expect(screen.getByText('Second task')).toBeTruthy();

    // Verify data-task-id attributes
    expect(container.querySelector('[data-task-id="t1"]')).not.toBeNull();
    expect(container.querySelector('[data-task-id="t2"]')).not.toBeNull();
  });

  it('renders task list with role="list" and aria-label', () => {
    tasks.value = [createTask({ id: 't1' })];

    render(<TaskListView />);

    const list = screen.getByRole('list');
    expect(list).toBeTruthy();
    expect(list.getAttribute('aria-label')).toBe('Tasks');
  });

  // --- Delete confirmation ---

  it('shows delete confirmation dialog when delete button is clicked', () => {
    const task = createTask({ id: 't-del', title: 'Task to delete' });
    tasks.value = [task];

    render(<TaskListView />);

    // Click delete button on the task
    fireEvent.click(screen.getByLabelText('Delete task: Task to delete'));

    // Confirmation dialog should appear
    expect(screen.getByText('Delete this task?')).toBeTruthy();
    expect(screen.getByText('This action cannot be undone.')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy(); // Confirm button
    expect(screen.getByText('Cancel')).toBeTruthy(); // Cancel button
  });

  it('calls deleteTask and closes dialog when delete is confirmed', async () => {
    const task = createTask({ id: 't-del-2', title: 'Another task' });
    tasks.value = [task];

    render(<TaskListView />);

    // Open confirmation dialog
    fireEvent.click(screen.getByLabelText('Delete task: Another task'));
    expect(screen.getByText('Delete this task?')).toBeTruthy();

    // Click the confirm Delete button — confirmDelete is async so we
    // must yield to the microtask queue before checking post-state.
    fireEvent.click(screen.getByText('Delete'));

    // Verify deleteTask was called with the correct id
    expect(deleteTask).toHaveBeenCalledOnce();
    expect(deleteTask).toHaveBeenCalledWith('t-del-2');

    // Wait for the async handler to complete and re-render
    await vi.waitFor(() => {
      expect(screen.queryByText('Delete this task?')).toBeNull();
    });
  });

  it('closes delete dialog when cancel is clicked', () => {
    const task = createTask({ id: 't-del-3', title: 'Cancel task' });
    tasks.value = [task];

    render(<TaskListView />);

    // Open confirmation dialog
    fireEvent.click(screen.getByLabelText('Delete task: Cancel task'));
    expect(screen.getByText('Delete this task?')).toBeTruthy();

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should be dismissed
    expect(screen.queryByText('Delete this task?')).toBeNull();
  });

  it('does not show confirmation dialog when there are no tasks', () => {
    tasks.value = [];
    render(<TaskListView />);

    expect(screen.queryByText('Delete this task?')).toBeNull();
  });
});
