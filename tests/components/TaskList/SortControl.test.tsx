import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { SortControl } from '@/components/Sidebar/SortControl.tsx';
import { activeSort, sortDirection } from '@/stores/uiStore.ts';

describe('SortControl', () => {
  beforeEach(() => {
    activeSort.value = 'manual';
    sortDirection.value = 'asc';
  });

  afterEach(cleanup);

  it('renders sort dropdown with all options', () => {
    render(<SortControl />);

    const select = screen.getByLabelText('Sort by') as HTMLSelectElement;
    expect(select).toBeTruthy();

    const options = Array.from(select.options).map((o) => o.textContent);
    expect(options).toEqual(['Manual', 'Due Date', 'Created', 'Priority']);
  });

  it('reflects the current sort value in the dropdown', () => {
    activeSort.value = 'createdAt';
    const { rerender } = render(<SortControl />);

    let select = screen.getByLabelText('Sort by') as HTMLSelectElement;
    expect(select.value).toBe('createdAt');

    activeSort.value = 'dueDate';
    rerender(<SortControl />);

    select = screen.getByLabelText('Sort by') as HTMLSelectElement;
    expect(select.value).toBe('dueDate');
  });

  it('sets activeSort signal on dropdown change', () => {
    render(<SortControl />);

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'createdAt' } });
    expect(activeSort.value).toBe('createdAt');

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'priority' } });
    expect(activeSort.value).toBe('priority');

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'dueDate' } });
    expect(activeSort.value).toBe('dueDate');

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'manual' } });
    expect(activeSort.value).toBe('manual');
  });

  it('shows ascending direction button initially', () => {
    sortDirection.value = 'asc';
    render(<SortControl />);

    const dirBtn = screen.getByLabelText('Sort ascending');
    expect(dirBtn).toBeTruthy();
  });

  it('shows descending direction button when direction is desc', () => {
    sortDirection.value = 'desc';
    render(<SortControl />);

    const dirBtn = screen.getByLabelText('Sort descending');
    expect(dirBtn).toBeTruthy();
  });

  it('toggles sort direction when direction button is clicked', () => {
    sortDirection.value = 'asc';
    render(<SortControl />);

    const dirBtn = screen.getByLabelText('Sort ascending');
    fireEvent.click(dirBtn);

    expect(sortDirection.value).toBe('desc');
  });

  it('direction button label updates after toggle', () => {
    sortDirection.value = 'asc';
    const { rerender } = render(<SortControl />);

    expect(screen.getByLabelText('Sort ascending')).toBeTruthy();

    sortDirection.value = 'desc';
    rerender(<SortControl />);

    expect(screen.getByLabelText('Sort descending')).toBeTruthy();
  });
});
