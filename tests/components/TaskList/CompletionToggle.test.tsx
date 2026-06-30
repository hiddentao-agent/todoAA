import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { CompletionToggle } from '@/components/TaskList/CompletionToggle.tsx';

describe('CompletionToggle', () => {
  afterEach(cleanup);

  it('renders a button with role="checkbox" and correct aria-label', () => {
    render(<CompletionToggle completed={false} taskTitle="Buy groceries" onToggle={() => {}} />);
    const btn = screen.getByRole('checkbox');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Mark "Buy groceries" as complete');
  });

  it('shows checked state when completed=true', () => {
    render(<CompletionToggle completed={true} taskTitle="Test" onToggle={() => {}} />);
    const btn = screen.getByRole('checkbox');
    expect(btn.getAttribute('aria-checked')).toBe('true');
  });

  it('shows unchecked state when completed=false', () => {
    render(<CompletionToggle completed={false} taskTitle="Test" onToggle={() => {}} />);
    const btn = screen.getByRole('checkbox');
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<CompletionToggle completed={false} taskTitle="Test" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('generates aria-label from taskTitle', () => {
    const { unmount } = render(
      <CompletionToggle completed={false} taskTitle="Read a book" onToggle={() => {}} />,
    );
    expect(screen.getByRole('checkbox').getAttribute('aria-label')).toBe(
      'Mark "Read a book" as complete',
    );
    unmount();

    render(<CompletionToggle completed={true} taskTitle="Read a book" onToggle={() => {}} />);
    expect(screen.getByRole('checkbox').getAttribute('aria-label')).toBe(
      'Mark "Read a book" as incomplete',
    );
  });
});
