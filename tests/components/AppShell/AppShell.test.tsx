import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { AppShell } from '@/components/AppShell/AppShell.tsx';
import { dbReady, dbError } from '@/components/providers/DatabaseProvider.tsx';
import { lists, currentListId, listStats } from '@/stores/listStore.ts';
import { sidebarOpen } from '@/stores/uiStore.ts';

describe('AppShell', () => {
  beforeEach(() => {
    dbReady.value = false;
    dbError.value = null;
    sidebarOpen.value = false;
    lists.value = [
      {
        id: 'list-1',
        name: 'My List',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    currentListId.value = 'list-1';
    listStats.value = new Map([
      ['list-1', { total: 10, active: 7, completed: 3 }],
    ]);
  });

  it('renders content when dbReady is true', () => {
    dbReady.value = true;
    render(
      <AppShell
        sidebar={<div data-testid="sidebar">Sidebar Content</div>}
        filterBar={<div data-testid="filter-bar">FilterBar</div>}
        sortControl={<div data-testid="sort-control">SortControl</div>}
        taskList={<div data-testid="task-list">TaskListView</div>}
      />,
    );

    expect(screen.getByTestId('sidebar')).toBeDefined();
    expect(screen.getByTestId('filter-bar')).toBeDefined();
    expect(screen.getByTestId('sort-control')).toBeDefined();
    expect(screen.getByTestId('task-list')).toBeDefined();
    expect(screen.getByText('My List')).toBeDefined();
  });

  it('renders the list title from current list', () => {
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    expect(screen.getByText('My List')).toBeDefined();
  });

  it('renders task count stats in the header', () => {
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    const statsEl = screen.getByText('7 of 10 active');
    expect(statsEl).toBeDefined();
    expect(statsEl.getAttribute('aria-live')).toBe('polite');
  });

  it('shows placeholder title when there is no current list', () => {
    currentListId.value = null;
    lists.value = [];
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    expect(screen.getByText('Todo')).toBeDefined();
  });

  it('renders the sidebar toggle button with correct aria attributes', () => {
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    const toggleBtn = screen.getByLabelText('Toggle sidebar');
    expect(toggleBtn).toBeDefined();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    expect(toggleBtn.getAttribute('aria-controls')).toBe('sidebar');
  });

  it('toggle sidebar button reflects sidebarOpen state', () => {
    sidebarOpen.value = true;
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    const toggleBtn = screen.getByLabelText('Toggle sidebar');
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking toggle sidebar button invokes toggleSidebar', () => {
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    expect(sidebarOpen.value).toBe(false);
    fireEvent.click(screen.getByLabelText('Toggle sidebar'));
    expect(sidebarOpen.value).toBe(true);
  });

  it('renders the floating create task button', () => {
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    const fab = screen.getByLabelText('Create new task');
    expect(fab).toBeDefined();
    expect(fab.tagName).toBe('BUTTON');
  });

  it('shows zero stats when listStats has no entry for current list', () => {
    listStats.value = new Map();
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    expect(screen.getByText('0 of 0 active')).toBeDefined();
  });

  it('renders when dbReady is false (loading state)', () => {
    dbReady.value = false;
    render(
      <AppShell
        sidebar={<div>Sidebar</div>}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div aria-busy="true">Loading...</div>}
      />,
    );

    expect(screen.getByText('Loading...')).toBeDefined();
    expect(screen.getByText('Sidebar')).toBeDefined();
  });

  it('renders when dbError is set (error state — AppShell still renders children)', () => {
    dbError.value = 'Something went wrong';
    render(
      <AppShell
        sidebar={<div>Error Sidebar</div>}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    expect(screen.getByText('Error Sidebar')).toBeDefined();
    expect(screen.getByText('My List')).toBeDefined();
  });

  it('renders FilterBar and SortControl in the content header actions', () => {
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div data-testid="filter-bar-content">Filter</div>}
        sortControl={<div data-testid="sort-control-content">Sort</div>}
        taskList={<div />}
      />,
    );

    expect(screen.getByTestId('filter-bar-content')).toBeDefined();
    expect(screen.getByTestId('sort-control-content')).toBeDefined();
  });

  it('renders the main content area with correct id', () => {
    render(
      <AppShell
        sidebar={<div />}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    const main = document.querySelector('#main-content');
    expect(main).not.toBeNull();
  });

  it('has the sidebar slot as a child of the shell container', () => {
    const { container } = render(
      <AppShell
        sidebar={<aside id="test-sidebar">Sidebar</aside>}
        filterBar={<div />}
        sortControl={<div />}
        taskList={<div />}
      />,
    );

    const sidebarEl = container.querySelector('#test-sidebar');
    expect(sidebarEl).not.toBeNull();
    expect(sidebarEl?.textContent).toBe('Sidebar');
  });
});
