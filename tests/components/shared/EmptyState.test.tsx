import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { EmptyState } from '@/components/shared/EmptyState.tsx';

describe('EmptyState', () => {
  describe('no-tasks type', () => {
    it('renders heading "No tasks yet" and helper message', () => {
      render(<EmptyState type="no-tasks" />);

      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first task to get started.'),
      ).toBeInTheDocument();
    });

    it('renders create task button when onCreateTask is provided', () => {
      render(<EmptyState type="no-tasks" onCreateTask={() => {}} />);

      expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    it('does not render create task button when onCreateTask is omitted', () => {
      render(<EmptyState type="no-tasks" />);

      expect(screen.queryByText('Create Task')).not.toBeInTheDocument();
    });

    it('fires onCreateTask callback when create task button is clicked', () => {
      const onCreateTask = vi.fn();

      render(<EmptyState type="no-tasks" onCreateTask={onCreateTask} />);

      fireEvent.click(screen.getByText('Create Task'));
      expect(onCreateTask).toHaveBeenCalledTimes(1);
    });
  });

  describe('no-results type', () => {
    it('renders heading "No results" and filter message', () => {
      render(<EmptyState type="no-results" />);

      expect(screen.getByText('No results')).toBeInTheDocument();
      expect(
        screen.getByText('No tasks match the current filter.'),
      ).toBeInTheDocument();
    });

    it('renders clear filter button when onClearFilter is provided', () => {
      render(<EmptyState type="no-results" onClearFilter={() => {}} />);

      expect(screen.getByText('Clear filter')).toBeInTheDocument();
    });

    it('does not render clear filter button when onClearFilter is omitted', () => {
      render(<EmptyState type="no-results" />);

      expect(screen.queryByText('Clear filter')).not.toBeInTheDocument();
    });

    it('fires onClearFilter callback when clear filter button is clicked', () => {
      const onClearFilter = vi.fn();

      render(<EmptyState type="no-results" onClearFilter={onClearFilter} />);

      fireEvent.click(screen.getByText('Clear filter'));
      expect(onClearFilter).toHaveBeenCalledTimes(1);
    });
  });

  it('uses role="status" for accessibility', () => {
    render(<EmptyState type="no-tasks" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
