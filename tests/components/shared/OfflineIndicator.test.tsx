import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/preact';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator.tsx';

/**
 * Helper to set navigator.onLine and dispatch the corresponding event.
 */
function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: online,
  });
}

describe('OfflineIndicator', () => {
  afterEach(() => {
    // Restore to online after each test
    setOnline(true);
  });

  it('shows offline indicator when navigator.onLine is false', async () => {
    setOnline(false);

    render(<OfflineIndicator />);

    // The effect reads navigator.onLine and sets state
    expect(
      await screen.findByText('You are offline. Changes will be saved locally.'),
    ).toBeInTheDocument();
  });

  it('shows offline indicator within a role="alert" element', async () => {
    setOnline(false);

    render(<OfflineIndicator />);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      'You are offline. Changes will be saved locally.',
    );
  });

  it('does not show anything when navigator.onLine is true', () => {
    setOnline(true);

    const { container } = render(<OfflineIndicator />);

    // The component returns null when online
    expect(container.innerHTML).toBe('');
  });

  it('reacts to online event after being offline', async () => {
    setOnline(false);

    render(<OfflineIndicator />);

    // Verify it first shows offline
    expect(
      await screen.findByText('You are offline. Changes will be saved locally.'),
    ).toBeInTheDocument();

    // Simulate coming back online
    await act(async () => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });

    // Component should return null when online
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reacts to offline event after being online', async () => {
    setOnline(true);

    const { container } = render(<OfflineIndicator />);

    // Initially not shown
    expect(container.innerHTML).toBe('');

    // Simulate going offline
    await act(async () => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });

    // Now it should show
    expect(
      await screen.findByText('You are offline. Changes will be saved locally.'),
    ).toBeInTheDocument();
  });
});
