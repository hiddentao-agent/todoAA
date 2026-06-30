import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { toastMessage } from '@/stores/uiStore.ts';
import { Toast } from '@/components/shared/Toast.tsx';

describe('Toast', () => {
  beforeEach(() => {
    toastMessage.value = null;
  });

  it('shows toast message when toastMessage signal has a value', () => {
    toastMessage.value = 'Task created successfully';

    render(<Toast />);

    expect(screen.getByText('Task created successfully')).toBeInTheDocument();
  });

  it('does not show anything when toastMessage signal is null', () => {
    toastMessage.value = null;

    const { container } = render(<Toast />);

    expect(container.innerHTML).toBe('');
  });

  it('uses role="status" and aria-live="polite" for accessibility', () => {
    toastMessage.value = 'Task saved';

    render(<Toast />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('updates displayed message when signal value changes', () => {
    toastMessage.value = 'First message';

    const { rerender } = render(<Toast />);

    expect(screen.getByText('First message')).toBeInTheDocument();

    toastMessage.value = 'Second message';

    rerender(<Toast />);

    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('hides toast when signal is cleared after being set', () => {
    toastMessage.value = 'Visible';

    const { container, rerender } = render(<Toast />);

    expect(screen.getByText('Visible')).toBeInTheDocument();

    toastMessage.value = null;

    rerender(<Toast />);

    expect(container.innerHTML).toBe('');
  });
});
