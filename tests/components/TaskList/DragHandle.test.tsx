import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/preact';
import { DragHandle } from '@/components/TaskList/DragHandle.tsx';

describe('DragHandle', () => {
  afterEach(cleanup);

  it('renders button with data-drag-handle and GripIcon when visible=true', () => {
    const { container } = render(<DragHandle visible={true} />);
    const btn = container.querySelector('[data-drag-handle]');
    expect(btn).not.toBeNull();
    expect(btn!.tagName).toBe('BUTTON');
    // GripIcon renders an SVG
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders placeholder div when visible=false', () => {
    const { container } = render(<DragHandle visible={false} />);
    expect(container.querySelector('[data-drag-handle]')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    // Should render a placeholder div instead
    const div = container.querySelector('div');
    expect(div).not.toBeNull();
  });

  it('has correct aria-label and aria-roledescription', () => {
    render(<DragHandle visible={true} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toBe('Drag to reorder');
    expect(btn.getAttribute('aria-roledescription')).toBe('sortable');
  });
});
