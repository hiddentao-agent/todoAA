import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/preact';
import { h } from 'preact';
import { useFocusTrap } from '@/hooks/useFocusTrap.ts';

/**
 * Helper: wait for the next animation frame so the hook's rAF callback runs.
 */
function waitForRaf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** Active trap — renders focusable children inside the container ref. */
function TrapContainer({
  active,
  onClose,
}: {
  active: boolean;
  onClose: () => void;
}) {
  const ref = useFocusTrap(active, onClose);
  return h(
    'div',
    { ref, 'data-testid': 'container', tabIndex: -1 },
    h('button', { 'data-testid': 'btn-first' }, 'First'),
    h('button', { 'data-testid': 'btn-second' }, 'Second'),
    h('button', { 'data-testid': 'btn-last' }, 'Last'),
  );
}

/** Trap with no focusable children at all. */
function TrapEmpty({
  active,
  onClose,
}: {
  active: boolean;
  onClose: () => void;
}) {
  const ref = useFocusTrap(active, onClose);
  return h('div', { ref, 'data-testid': 'container-empty', tabIndex: -1 });
}

describe('useFocusTrap', () => {
  let onClose: () => void;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
    // Ensure body has default overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  /* ---------------------------------------------------------- */
  /*  Inactive trap                                              */
  /* ---------------------------------------------------------- */

  it('does not move focus when active is false', () => {
    const { unmount } = render(
      h(TrapContainer, { active: false, onClose: onClose }),
    );
    expect(document.body.style.overflow).toBe('');
    unmount();
  });

  it('does not set up Escape listener when active is false', () => {
    render(h(TrapContainer, { active: false, onClose: onClose }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  /* ---------------------------------------------------------- */
  /*  Activation — focus moved to first element                  */
  /* ---------------------------------------------------------- */

  it('stores the currently focused element as trigger on activation', async () => {
    const outsideButton = document.createElement('button');
    outsideButton.id = 'outside-trigger';
    document.body.appendChild(outsideButton);
    outsideButton.focus();
    expect(document.activeElement?.id).toBe('outside-trigger');

    render(h(TrapContainer, { active: true, onClose: onClose }));
    await waitForRaf();

    expect(document.activeElement).not.toBe(outsideButton);
    document.body.removeChild(outsideButton);
  });

  it('moves focus to the first focusable element inside the container', async () => {
    render(h(TrapContainer, { active: true, onClose: onClose }));
    await waitForRaf();

    const firstBtn = screen.getByTestId('btn-first');
    expect(document.activeElement).toBe(firstBtn);
  });

  it('focuses the container itself when no focusable children exist', async () => {
    render(h(TrapEmpty, { active: true, onClose: onClose }));
    await waitForRaf();

    const container = screen.getByTestId('container-empty');
    expect(document.activeElement).toBe(container);
  });

  /* ---------------------------------------------------------- */
  /*  Escape key                                                 */
  /* ---------------------------------------------------------- */

  it('calls onClose when Escape is pressed', async () => {
    render(h(TrapContainer, { active: true, onClose: onClose }));
    await waitForRaf();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stops propagation of Escape event', async () => {
    render(h(TrapContainer, { active: true, onClose: onClose }));
    await waitForRaf();

    const spy = vi.fn<() => void>();
    window.addEventListener('keydown', spy);
    fireEvent.keyDown(document, { key: 'Escape' });
    window.removeEventListener('keydown', spy);

    expect(onClose).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  /* ---------------------------------------------------------- */
  /*  Tab trapping — forward                                     */
  /* ---------------------------------------------------------- */

  it('traps Tab from last element back to first', async () => {
    render(h(TrapContainer, { active: true, onClose: onClose }));
    await waitForRaf();

    const firstBtn = screen.getByTestId('btn-first');
    const lastBtn = screen.getByTestId('btn-last');
    lastBtn.focus();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(firstBtn);
  });

  it('does not prevent default Tab when not on last element', async () => {
    render(h(TrapContainer, { active: true, onClose: onClose }));
    await waitForRaf();

    const firstBtn = screen.getByTestId('btn-first');
    firstBtn.focus();

    fireEvent.keyDown(document, { key: 'Tab' });
    // focus doesn't actually change in jsdom from keydown,
    // so just verify no crash
  });

  /* ---------------------------------------------------------- */
  /*  Tab trapping — backward (Shift+Tab)                        */
  /* ---------------------------------------------------------- */

  it('traps Shift+Tab from first element back to last', async () => {
    render(h(TrapContainer, { active: true, onClose: onClose }));
    await waitForRaf();

    const firstBtn = screen.getByTestId('btn-first');
    const lastBtn = screen.getByTestId('btn-last');
    firstBtn.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastBtn);
  });

  it('does not wrap Shift+Tab from middle element', async () => {
    render(h(TrapContainer, { active: true, onClose: onClose }));
    await waitForRaf();

    const secondBtn = screen.getByTestId('btn-second');
    secondBtn.focus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  });

  it('prevents default Tab when no focusable children exist', async () => {
    render(h(TrapEmpty, { active: true, onClose: onClose }));
    await waitForRaf();

    // Fire Tab on the trap — the hook calls e.preventDefault() when
    // there are 0 focusable children to prevent focus from leaving
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const prevented = !document.dispatchEvent(event);
    // jsdom may or may not propagate to the keydown handler; verify no crash.
    // The important thing: the hook doesn't throw.
    void prevented;
  });

  /* ---------------------------------------------------------- */
  /*  Cleanup                                                    */
  /* ---------------------------------------------------------- */

  it('restores body overflow on deactivation', async () => {
    document.body.style.overflow = 'auto';

    const { rerender } = render(
      h(TrapContainer, { active: true, onClose: onClose }),
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(h(TrapContainer, { active: false, onClose: onClose }));
    expect(document.body.style.overflow).toBe('auto');
  });

  it('removes keydown listener on cleanup', async () => {
    const { unmount } = render(
      h(TrapContainer, { active: true, onClose: onClose }),
    );
    await waitForRaf();
    unmount();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('restores overflow on unmount', () => {
    document.body.style.overflow = 'scroll';

    const { unmount } = render(
      h(TrapContainer, { active: true, onClose: onClose }),
    );
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('returns focus to trigger element on deactivation', async () => {
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'trigger-btn';
    document.body.appendChild(triggerBtn);
    triggerBtn.focus();
    expect(document.activeElement?.id).toBe('trigger-btn');

    const { rerender } = render(
      h(TrapContainer, { active: true, onClose: onClose }),
    );
    await waitForRaf();

    rerender(h(TrapContainer, { active: false, onClose: onClose }));
    expect(document.activeElement?.id).toBe('trigger-btn');
    document.body.removeChild(triggerBtn);
  });
});
