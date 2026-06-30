import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ErrorBanner } from '@/components/shared/ErrorBanner.tsx';

describe('ErrorBanner', () => {
  it('renders error message', () => {
    render(<ErrorBanner message="Something went wrong." />);

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('uses role="alert" for accessibility', () => {
    render(<ErrorBanner message="Error occurred." />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders retry button when action prop is provided', () => {
    const action = { label: 'Retry', onClick: () => {} };

    render(<ErrorBanner message="Failed to load." action={action} />);

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('does not render action button when action prop is omitted', () => {
    render(<ErrorBanner message="Failed to load." />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires action onClick when retry button is clicked', () => {
    const onClick = vi.fn();
    const action = { label: 'Retry', onClick };

    render(<ErrorBanner message="Failed to load." action={action} />);

    fireEvent.click(screen.getByText('Retry'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders dismiss button when onDismiss is provided', () => {
    render(
      <ErrorBanner message="Warning." onDismiss={() => {}} />,
    );

    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('fires onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();

    render(<ErrorBanner message="Warning." onDismiss={onDismiss} />);

    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render dismiss button when onDismiss is omitted', () => {
    render(<ErrorBanner message="Warning." />);

    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });

  it('renders both action and dismiss buttons when both are provided', () => {
    const action = { label: 'Retry', onClick: () => {} };

    render(
      <ErrorBanner message="Error." action={action} onDismiss={() => {}} />,
    );

    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  it('handles missing action prop gracefully without throwing', () => {
    expect(() =>
      render(<ErrorBanner message="Just a message." />),
    ).not.toThrow();
  });
});
