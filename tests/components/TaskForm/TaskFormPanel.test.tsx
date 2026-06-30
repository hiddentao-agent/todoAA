import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { TaskFormPanel } from '@/components/TaskForm/TaskFormPanel.tsx';
import { taskFormOpen, editingTaskId } from '@/stores/uiStore.ts';
import { lists, currentListId } from '@/stores/listStore.ts';
import { tasks } from '@/stores/taskStore.ts';
import type { Task } from '@/db/todo-schema.ts';

// Mock taskStore async functions that touch the database
vi.mock('@/stores/taskStore.ts', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = await importOriginal();
  return {
    ...actual,
    createTask: vi.fn(),
    updateTask: vi.fn(),
  };
});

const mockLists = [
  {
    id: 'list-1',
    name: 'My Tasks',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'list-2',
    name: 'Work',
    isDefault: false,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const sampleTask: Task = {
  id: 'task-1',
  title: 'Buy groceries',
  description: 'Milk, eggs, bread',
  dueDate: '2024-06-15',
  priority: 'high',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  listId: 'list-1',
  order: 0,
};

describe('TaskFormPanel', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    taskFormOpen.value = false;
    editingTaskId.value = null;
    lists.value = mockLists;
    currentListId.value = 'list-1';
    tasks.value = [sampleTask];

    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  describe('visibility', () => {
    it('shows the panel when taskFormOpen is true', () => {
      taskFormOpen.value = true;
      render(<TaskFormPanel />);

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('New Task')).toBeDefined();
    });

    it('returns null when taskFormOpen is false', () => {
      taskFormOpen.value = false;
      const { container } = render(<TaskFormPanel />);

      expect(container.innerHTML).toBe('');
    });
  });

  describe('form fields', () => {
    beforeEach(() => {
      taskFormOpen.value = true;
    });

    it('renders the title input', () => {
      render(<TaskFormPanel />);

      const titleInput = screen.getByLabelText(/Title/);
      expect(titleInput).toBeDefined();
      expect(titleInput.getAttribute('placeholder')).toBe('What needs to be done?');
    });

    it('renders the description textarea', () => {
      render(<TaskFormPanel />);

      const descInput = screen.getByLabelText('Description');
      expect(descInput).toBeDefined();
      expect(descInput.tagName).toBe('TEXTAREA');
    });

    it('renders the due date input', () => {
      render(<TaskFormPanel />);

      const dateInput = screen.getByLabelText('Due Date');
      expect(dateInput).toBeDefined();
      expect(dateInput.getAttribute('type')).toBe('date');
    });

    it('renders the priority select', () => {
      render(<TaskFormPanel />);

      const prioritySelect = screen.getByLabelText('Priority');
      expect(prioritySelect).toBeDefined();
      expect(prioritySelect.tagName).toBe('SELECT');
    });

    it('renders the list selector with options', () => {
      render(<TaskFormPanel />);

      const listSelect = screen.getByLabelText('List');
      expect(listSelect).toBeDefined();
      expect(listSelect.tagName).toBe('SELECT');

      const options = listSelect.querySelectorAll('option');
      expect(options.length).toBe(2);
      expect(options[0]?.textContent).toBe('My Tasks');
      expect(options[1]?.textContent).toBe('Work');
    });

    it('renders Create button in new task mode', () => {
      render(<TaskFormPanel />);

      expect(screen.getByText('Create')).toBeDefined();
    });

    it('renders Cancel button', () => {
      render(<TaskFormPanel />);

      expect(screen.getByText('Cancel')).toBeDefined();
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      taskFormOpen.value = true;
    });

    it('shows error when submitting with empty title', () => {
      render(<TaskFormPanel />);

      const createBtn = screen.getByText('Create');
      fireEvent.click(createBtn);

      expect(screen.getByText('Title is required')).toBeDefined();
    });

    it('shows error when submitting with whitespace-only title', () => {
      render(<TaskFormPanel />);

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.input(titleInput, { target: { value: '   ' } });

      const createBtn = screen.getByText('Create');
      fireEvent.click(createBtn);

      expect(screen.getByText('Title is required')).toBeDefined();
    });
  });

  describe('submit for new task', () => {
    beforeEach(() => {
      taskFormOpen.value = true;
    });

    it('calls createTask with form data on valid submit', async () => {
      const { createTask } = await import('@/stores/taskStore.ts');

      render(<TaskFormPanel />);

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.input(titleInput, { target: { value: 'New task title' } });

      const descInput = screen.getByLabelText('Description');
      fireEvent.input(descInput, { target: { value: 'Task description' } });

      const dateInput = screen.getByLabelText('Due Date');
      fireEvent.input(dateInput, { target: { value: '2024-07-01' } });

      const prioritySelect = screen.getByLabelText('Priority');
      fireEvent.change(prioritySelect, { target: { value: 'high' } });

      const listSelect = screen.getByLabelText('List');
      fireEvent.change(listSelect, { target: { value: 'list-2' } });

      fireEvent.click(screen.getByText('Create'));

      expect(createTask).toHaveBeenCalledTimes(1);
      expect(createTask).toHaveBeenCalledWith({
        title: 'New task title',
        description: 'Task description',
        dueDate: '2024-07-01',
        priority: 'high',
        listId: 'list-2',
      });
    });

    it('passes null for optional fields when empty', async () => {
      const { createTask } = await import('@/stores/taskStore.ts');

      render(<TaskFormPanel />);

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.input(titleInput, { target: { value: 'Minimal task' } });

      fireEvent.click(screen.getByText('Create'));

      expect(createTask).toHaveBeenCalledWith({
        title: 'Minimal task',
        description: null,
        dueDate: null,
        priority: 'none',
        listId: 'list-1',
      });
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      editingTaskId.value = 'task-1';
      taskFormOpen.value = true;
    });

    it('shows "Edit Task" title in edit mode', () => {
      render(<TaskFormPanel />);

      expect(screen.getByText('Edit Task')).toBeDefined();
    });

    it('pre-fills form fields with task data', () => {
      render(<TaskFormPanel />);

      const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
      expect(titleInput.value).toBe('Buy groceries');

      const descInput = screen.getByLabelText('Description') as HTMLTextAreaElement;
      expect(descInput.value).toBe('Milk, eggs, bread');

      const dateInput = screen.getByLabelText('Due Date') as HTMLInputElement;
      expect(dateInput.value).toBe('2024-06-15');

      const prioritySelect = screen.getByLabelText('Priority') as HTMLSelectElement;
      expect(prioritySelect.value).toBe('high');
    });

    it('shows "Save" button in edit mode', () => {
      render(<TaskFormPanel />);

      expect(screen.getByText('Save')).toBeDefined();
    });

    it('calls updateTask with updated data on submit', async () => {
      const { updateTask } = await import('@/stores/taskStore.ts');

      render(<TaskFormPanel />);

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.input(titleInput, { target: { value: 'Updated title' } });

      fireEvent.click(screen.getByText('Save'));

      expect(updateTask).toHaveBeenCalledTimes(1);
      expect(updateTask).toHaveBeenCalledWith('task-1', {
        title: 'Updated title',
        description: 'Milk, eggs, bread',
        dueDate: '2024-06-15',
        priority: 'high',
        listId: 'list-1',
      });
    });
  });

  describe('close behavior', () => {
    it('close button closes the panel', () => {
      taskFormOpen.value = true;
      render(<TaskFormPanel />);

      fireEvent.click(screen.getByLabelText('Close'));
      expect(taskFormOpen.value).toBe(false);
      expect(editingTaskId.value).toBeNull();
    });

    it('Cancel button closes the panel', () => {
      taskFormOpen.value = true;
      render(<TaskFormPanel />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(taskFormOpen.value).toBe(false);
    });
  });

  describe('overlay click', () => {
    it('with dirty form and confirm false stays open', () => {
      taskFormOpen.value = true;
      confirmSpy.mockReturnValue(false);

      const { container } = render(<TaskFormPanel />);

      // Make form dirty
      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.input(titleInput, { target: { value: 'Some text' } });

      const overlay = container.querySelector('[aria-hidden="true"]');
      fireEvent.click(overlay!);

      expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Discard them?');
      expect(taskFormOpen.value).toBe(true); // stays open because confirm was false
    });

    it('with dirty form and confirm true closes the panel', () => {
      taskFormOpen.value = true;
      confirmSpy.mockReturnValue(true);

      const { container } = render(<TaskFormPanel />);

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.input(titleInput, { target: { value: 'Some text' } });

      const overlay = container.querySelector('[aria-hidden="true"]');
      fireEvent.click(overlay!);

      expect(taskFormOpen.value).toBe(false);
    });

    it('with empty form closes directly', () => {
      taskFormOpen.value = true;
      // Reset spy to clear any prior calls from global effects
      confirmSpy.mockClear();

      const { container } = render(<TaskFormPanel />);

      // Verify form is initially clean
      const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
      expect(titleInput.value).toBe('');

      const overlay = container.querySelector('[aria-hidden="true"]');
      fireEvent.click(overlay!);

      // With a clean form, confirm should not have been called
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(taskFormOpen.value).toBe(false);
    });
  });

  describe('disabled submit button during submission', () => {
    it('disables the submit button while submitting', () => {
      taskFormOpen.value = true;
      render(<TaskFormPanel />);

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.input(titleInput, { target: { value: 'Task title' } });

      const submitBtn = screen.getByText('Create');
      fireEvent.click(submitBtn);

      expect(submitBtn.getAttribute('disabled')).toBeDefined();
    });
  });
});
