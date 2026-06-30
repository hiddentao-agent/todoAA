import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.tsx';

describe('ConfirmDialog', () => {
  it('renders title and message', () => {
    render(
      <ConfirmDialog
        title="Delete task"
        message="Are you sure you want to delete this task?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText('Delete task')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to delete this task?'),
    ).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons with default labels', () => {
    render(
      <ConfirmDialog
        title="Delete task"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        title="Delete task"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        title="Delete task"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders with role alertdialog and correct aria attributes', () => {
    render(
      <ConfirmDialog
        title="Delete task"
        message="This action cannot be undone."
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'confirm-message');
  });

  it('renders with danger variant and correct confirm label', () => {
    render(
      <ConfirmDialog
        title="Delete task"
        message="Are you sure?"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders custom confirm label', () => {
    render(
      <ConfirmDialog
        title="Save changes"
        message="Do you want to save?"
        confirmLabel="Save"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders custom cancel label', () => {
    render(
      <ConfirmDialog
        title="Save changes"
        message="Do you want to save?"
        cancelLabel="No"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders overlay with aria-hidden and calls onCancel on click', () => {
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        title="Test"
        message="Test message"
        onConfirm={() => {}}
        onCancel={onCancel}
      />,
    );

    // The overlay is the first child of the fragment with aria-hidden="true"
    const overlay = document.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();

    if (overlay) {
      fireEvent.click(overlay);
      expect(onCancel).toHaveBeenCalledTimes(1);
    }
  });
});
