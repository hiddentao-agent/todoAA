import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { announcerMessage } from '@/stores/uiStore.ts';
import { Announcer } from '@/components/shared/Announcer.tsx';

describe('Announcer', () => {
  beforeEach(() => {
    announcerMessage.value = '';
  });

  it('renders with role="status" and aria-live="polite"', () => {
    announcerMessage.value = 'Test announcement';

    render(<Announcer />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });

  it('displays the announcerMessage value', () => {
    announcerMessage.value = 'Task created successfully';

    render(<Announcer />);

    expect(screen.getByText('Task created successfully')).toBeInTheDocument();
  });

  it('updates displayed text when announcerMessage changes', () => {
    announcerMessage.value = 'First message';

    const { rerender } = render(<Announcer />);

    expect(screen.getByText('First message')).toBeInTheDocument();

    announcerMessage.value = 'Second message';

    rerender(<Announcer />);

    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('renders empty text when announcerMessage is empty string', () => {
    announcerMessage.value = '';

    const { container } = render(<Announcer />);

    // The component renders a div with role="status" containing just the message text
    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveTextContent('');
  });

  it('renders with "sr-only" class for screen-reader-only styling', () => {
    announcerMessage.value = 'Hidden announcement';

    const { container } = render(<Announcer />);

    const statusEl = container.querySelector('[role="status"]');
    expect(statusEl).toHaveClass('sr-only');
  });
});
