import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { Sidebar } from '@/components/Sidebar/Sidebar.tsx';
import { lists, currentListId, listStats } from '@/stores/listStore.ts';
import { sidebarOpen, settingsOpen, showToast } from '@/stores/uiStore.ts';
import { createList, renameList, deleteListCascade } from '@/stores/listStore.ts';

// Mock listStore async functions that touch the database
vi.mock('@/stores/listStore.ts', async (importOriginal) => {
  // vitest hoists vi.mock — use importOriginal to access original module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = await importOriginal();
  return {
    ...actual,
    createList: vi.fn(),
    renameList: vi.fn(),
    deleteListCascade: vi.fn(),
  };
});

// Mock showToast to verify error surfacing
vi.mock('@/stores/uiStore.ts', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = await importOriginal();
  return {
    ...actual,
    showToast: vi.fn(),
  };
});

describe('Sidebar', () => {
  beforeEach(() => {
    lists.value = [
      {
        id: 'list-default',
        name: 'My Tasks',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'list-work',
        name: 'Work',
        isDefault: false,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: 'list-personal',
        name: 'Personal',
        isDefault: false,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
    ];
    currentListId.value = 'list-default';
    listStats.value = new Map([
      ['list-default', { total: 5, active: 3, completed: 2 }],
      ['list-work', { total: 12, active: 8, completed: 4 }],
      ['list-personal', { total: 3, active: 1, completed: 2 }],
    ]);
    sidebarOpen.value = true;
  });

  it('renders all lists from the lists signal', () => {
    render(<Sidebar />);

    expect(screen.getByText('My Tasks')).toBeDefined();
    expect(screen.getByText('Work')).toBeDefined();
    expect(screen.getByText('Personal')).toBeDefined();
  });

  it('shows task counts next to each list', () => {
    render(<Sidebar />);

    const listItems = screen.getAllByRole('option');
    expect(listItems.length).toBe(3);
    expect(screen.getByLabelText('My Tasks — 3 tasks')).toBeDefined();
    expect(screen.getByLabelText('Work — 8 tasks')).toBeDefined();
    expect(screen.getByLabelText('Personal — 1 tasks')).toBeDefined();
  });

  it('highlights the current list with aria-selected', () => {
    render(<Sidebar />);

    const defaultOption = screen.getByLabelText('My Tasks — 3 tasks');
    expect(defaultOption.getAttribute('aria-selected')).toBe('true');

    const workOption = screen.getByLabelText('Work — 8 tasks');
    expect(workOption.getAttribute('aria-selected')).toBe('false');
  });

  it('clicking on a list selects it and closes the sidebar', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Work — 8 tasks'));

    expect(currentListId.value).toBe('list-work');
    expect(sidebarOpen.value).toBe(false);
  });

  it('selects list via keyboard Enter key', () => {
    render(<Sidebar />);

    const personalOption = screen.getByLabelText('Personal — 1 tasks');
    fireEvent.keyDown(personalOption, { key: 'Enter' });

    expect(currentListId.value).toBe('list-personal');
    expect(sidebarOpen.value).toBe(false);
  });

  it('shows the "New List" button when not creating', () => {
    render(<Sidebar />);

    const newListBtn = screen.getByLabelText('Create new list');
    expect(newListBtn).toBeDefined();
    expect(newListBtn.textContent).toContain('New List');
  });

  it('clicking "New List" shows the create input', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Create new list'));

    const input = screen.getByLabelText('New list name');
    expect(input).toBeDefined();
  });

  it('shows rename and delete buttons on non-default list items', () => {
    render(<Sidebar />);

    expect(screen.getByLabelText('Rename list: Work')).toBeDefined();
    expect(screen.getByLabelText('Delete list: Work')).toBeDefined();
    expect(screen.getByLabelText('Rename list: Personal')).toBeDefined();
    expect(screen.getByLabelText('Delete list: Personal')).toBeDefined();
  });

  it('does NOT show rename and delete buttons on the default list', () => {
    render(<Sidebar />);

    expect(screen.queryByLabelText('Rename list: My Tasks')).toBeNull();
    expect(screen.queryByLabelText('Delete list: My Tasks')).toBeNull();
  });

  it('clicking rename on a list shows inline edit input', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Rename list: Work'));

    const editInput = screen.getByDisplayValue('Work');
    expect(editInput).toBeDefined();
    expect(editInput.tagName).toBe('INPUT');
  });

  it('clicking delete on a list shows confirm dialog', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Delete list: Work'));

    expect(screen.getByText(/Delete list 'Work'/)).toBeDefined();
    expect(screen.getByText(/permanently delete this list/)).toBeDefined();
  });

  it('confirm dialog has Delete and Cancel buttons', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Delete list: Personal'));

    expect(screen.getByText('Delete')).toBeDefined();
    expect(screen.getByText('Cancel')).toBeDefined();
  });

  it('confirm dialog cancel hides the dialog', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Delete list: Personal'));
    expect(screen.getByRole('alertdialog')).toBeDefined();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('shows the sidebar overlay div when open', () => {
    const { container } = render(<Sidebar />);

    const overlay = container.querySelector('div[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
  });

  it('clicking the overlay closes the sidebar', () => {
    const { container } = render(<Sidebar />);

    const overlay = container.querySelector('div[aria-hidden="true"]');
    fireEvent.click(overlay!);

    expect(sidebarOpen.value).toBe(false);
  });

  it('close sidebar button works', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Close sidebar'));
    expect(sidebarOpen.value).toBe(false);
  });

  it('does not render overlay div when sidebar is closed', () => {
    sidebarOpen.value = false;
    const { container } = render(<Sidebar />);

    const overlay = container.querySelector('div[aria-hidden="true"]');
    expect(overlay).toBeNull();
  });

  it('applies closed class to sidebar when sidebarOpen is false', () => {
    sidebarOpen.value = false;
    const { container } = render(<Sidebar />);

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    // Should NOT have the open class
    expect(aside?.className).not.toMatch(/_open_/);
  });

  it('renders the settings button in the footer', () => {
    render(<Sidebar />);

    const settingsBtn = screen.getByLabelText('Open settings');
    expect(settingsBtn).toBeDefined();
  });

  it('renders storage info text in the footer after async estimate', async () => {
    render(<Sidebar />);

    // estimateStorage returns { usageBytes: 0, quotaBytes: 0, usagePercent: 0 }
    // formatBytes(0) returns "0 B"
    expect(await screen.findByText('0 B used')).toBeDefined();
  });
});

describe('Sidebar — create list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lists.value = [
      {
        id: 'list-default',
        name: 'My Tasks',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    currentListId.value = 'list-default';
    sidebarOpen.value = true;
  });

  it('creates a new list when Enter is pressed', async () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Create new list'));
    const input = screen.getByLabelText('New list name');
    fireEvent.input(input, { target: { value: 'Shopping' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(createList).toHaveBeenCalledWith('Shopping');
    });
  });

  it('does nothing for empty list name on Enter', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Create new list'));
    const input = screen.getByLabelText('New list name');
    fireEvent.input(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(createList).not.toHaveBeenCalled();
  });

  it('cancels creation when Escape is pressed', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Create new list'));
    const input = screen.getByLabelText('New list name');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByLabelText('New list name')).toBeNull();
    expect(screen.getByLabelText('Create new list')).toBeDefined();
  });

  it('cancels creation on blur when input is empty', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Create new list'));
    expect(screen.getByLabelText('New list name')).toBeDefined();

    const input = screen.getByLabelText('New list name');
    fireEvent.blur(input);

    expect(screen.queryByLabelText('New list name')).toBeNull();
    expect(screen.getByLabelText('Create new list')).toBeDefined();
  });

  it('does not cancel creation on blur when input is not empty', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Create new list'));
    const input = screen.getByLabelText('New list name');
    fireEvent.input(input, { target: { value: 'Shopping' } });
    fireEvent.blur(input);
    // Input should still be visible (creating remains true)
    expect(screen.getByLabelText('New list name')).toBeDefined();
  });

  it('handles create failure gracefully', async () => {
    // @ts-expect-error createList is mocked
    createList.mockRejectedValueOnce(new Error('Create failed'));
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Create new list'));
    const input = screen.getByLabelText('New list name');
    fireEvent.input(input, { target: { value: 'Shopping' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await vi.waitFor(() => {
      // Input should remain visible (creating stays true on error)
      expect(screen.getByLabelText('New list name')).toBeDefined();
    });
    expect(showToast).toHaveBeenCalledWith('Create failed');
  });

  it('shows "Operation failed" when create rejects with a non-Error value', async () => {
    // @ts-expect-error createList is mocked
    createList.mockRejectedValueOnce('plain string error');
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Create new list'));
    const input = screen.getByLabelText('New list name');
    fireEvent.input(input, { target: { value: 'Shopping' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await vi.waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Operation failed');
    });
  });
});

describe('Sidebar — rename list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lists.value = [
      {
        id: 'list-default',
        name: 'My Tasks',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'list-work',
        name: 'Work',
        isDefault: false,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];
    currentListId.value = 'list-default';
    sidebarOpen.value = true;
  });

  it('submits rename when Enter is pressed', async () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Rename list: Work'));
    const editInput = screen.getByDisplayValue('Work');
    fireEvent.input(editInput, { target: { value: 'Office' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    await waitFor(() => {
      expect(renameList).toHaveBeenCalledWith('list-work', 'Office');
    });
  });

  it('submits rename on blur of the inline input', async () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Rename list: Work'));
    const editInput = screen.getByDisplayValue('Work');
    fireEvent.input(editInput, { target: { value: 'Office' } });
    fireEvent.blur(editInput);

    await waitFor(() => {
      expect(renameList).toHaveBeenCalledWith('list-work', 'Office');
    });
  });

  it('cancels rename when the name is unchanged on submit', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Rename list: Work'));
    const editInput = screen.getByDisplayValue('Work');
    // Submit without changing the value
    fireEvent.keyDown(editInput, { key: 'Enter' });

    expect(renameList).not.toHaveBeenCalled();
  });

  it('clicking the inline rename input stops propagation to the list item', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Rename list: Work'));
    const editInput = screen.getByDisplayValue('Work');

    // Clicking the input should trigger stopPropagation and NOT select the list
    fireEvent.click(editInput);

    // The sidebar should still be open (handleSelect is NOT called)
    expect(sidebarOpen.value).toBe(true);
  });

  it('cancels rename when Escape is pressed', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Rename list: Work'));
    expect(screen.getByDisplayValue('Work')).toBeDefined();

    const editInput = screen.getByDisplayValue('Work');
    fireEvent.keyDown(editInput, { key: 'Escape' });

    expect(screen.queryByDisplayValue('Work')).toBeNull();
    expect(screen.getByText('Work')).toBeDefined();
  });

  it('handles rename failure gracefully', async () => {
    // @ts-expect-error renameList is mocked
    renameList.mockRejectedValueOnce(new Error('Rename failed'));
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Rename list: Work'));
    const editInput = screen.getByDisplayValue('Work');
    fireEvent.input(editInput, { target: { value: 'Office' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });
    // Should not throw — component surfaces error via toast
    await vi.waitFor(() => {
      expect(screen.queryByDisplayValue('Office')).toBeNull();
    });
    expect(showToast).toHaveBeenCalledWith('Rename failed');
  });

  it('shows "Operation failed" when rename rejects with a non-Error value', async () => {
    // @ts-expect-error renameList is mocked
    renameList.mockRejectedValueOnce('plain string error');
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Rename list: Work'));
    const editInput = screen.getByDisplayValue('Work');
    fireEvent.input(editInput, { target: { value: 'Office' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });
    await vi.waitFor(() => {
      expect(screen.queryByDisplayValue('Office')).toBeNull();
    });
    expect(showToast).toHaveBeenCalledWith('Operation failed');
  });
});

describe('Sidebar — delete list', () => {
  beforeEach(() => {
    lists.value = [
      {
        id: 'list-default',
        name: 'My Tasks',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'list-work',
        name: 'Work',
        isDefault: false,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];
    currentListId.value = 'list-default';
    sidebarOpen.value = true;
  });

  it('confirming delete triggers deleteListCascade', async () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Delete list: Work'));
    expect(screen.getByRole('alertdialog')).toBeDefined();

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(deleteListCascade).toHaveBeenCalledWith('list-work');
    });
  });

  it('confirm dialog shows correct task count in message', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Delete list: Work'));

    expect(screen.getByText(/all 12 tasks/)).toBeDefined();
  });

  it('handles delete failure gracefully', async () => {
    // @ts-expect-error deleteListCascade is mocked
    deleteListCascade.mockRejectedValueOnce(new Error('Delete failed'));
    render(<Sidebar />);
    fireEvent.click(screen.getByLabelText('Delete list: Work'));
    fireEvent.click(screen.getByText('Delete'));
    await vi.waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
    expect(showToast).toHaveBeenCalledWith('Delete failed');
  });
});

describe('Sidebar — footer', () => {
  beforeEach(() => {
    lists.value = [
      {
        id: 'list-default',
        name: 'My Tasks',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    currentListId.value = 'list-default';
    sidebarOpen.value = true;
  });

  it('settings button opens the settings panel', () => {
    settingsOpen.value = false;
    render(<Sidebar />);

    fireEvent.click(screen.getByLabelText('Open settings'));
    expect(settingsOpen.value).toBe(true);
  });
});
