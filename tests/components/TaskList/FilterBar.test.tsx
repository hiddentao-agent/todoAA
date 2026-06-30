import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { FilterBar } from '@/components/Sidebar/FilterBar.tsx';
import { activeFilter } from '@/stores/uiStore.ts';
import { currentListId, listStats } from '@/stores/listStore.ts';

describe('FilterBar', () => {
  beforeEach(() => {
    activeFilter.value = 'all';
    currentListId.value = 'list-1';
    listStats.value = new Map([['list-1', { total: 10, active: 6, completed: 4 }]]);
  });

  afterEach(cleanup);

  it('renders All, Active, Completed filter buttons', () => {
    render(<FilterBar />);

    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('highlights the active filter button with aria-selected', () => {
    activeFilter.value = 'all';
    const { rerender } = render(<FilterBar />);

    // 'All' should be selected
    const allBtn = screen.getByText('All').closest('button')!;
    expect(allBtn.getAttribute('aria-selected')).toBe('true');

    // Active and Completed should not be selected
    const activeBtn = screen.getByText('Active').closest('button')!;
    const completedBtn = screen.getByText('Completed').closest('button')!;
    expect(activeBtn.getAttribute('aria-selected')).toBe('false');
    expect(completedBtn.getAttribute('aria-selected')).toBe('false');

    // Change active filter and re-render
    activeFilter.value = 'active';
    rerender(<FilterBar />);

    expect(screen.getByText('Active').closest('button')!.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('All').closest('button')!.getAttribute('aria-selected')).toBe('false');
  });

  it('sets activeFilter signal when a filter button is clicked', () => {
    render(<FilterBar />);

    fireEvent.click(screen.getByText('Active'));
    expect(activeFilter.value).toBe('active');

    fireEvent.click(screen.getByText('Completed'));
    expect(activeFilter.value).toBe('completed');

    fireEvent.click(screen.getByText('All'));
    expect(activeFilter.value).toBe('all');
  });

  it('displays task counts in aria-labels', () => {
    render(<FilterBar />);

    expect(screen.getByText('All').closest('button')!.getAttribute('aria-label')).toContain(
      '10 tasks',
    );
    expect(screen.getByText('Active').closest('button')!.getAttribute('aria-label')).toContain(
      '6 tasks',
    );
    expect(screen.getByText('Completed').closest('button')!.getAttribute('aria-label')).toContain(
      '4 tasks',
    );
  });

  it('renders within a role="tablist" container', () => {
    render(<FilterBar />);

    expect(screen.getByRole('tablist')).toBeTruthy();
  });
});
