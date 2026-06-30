import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import {
  PlusIcon,
  CheckIcon,
  TrashIcon,
  EditIcon,
  CloseIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  HamburgerIcon,
  SettingsIcon,
  DownloadIcon,
  UploadIcon,
  ListIcon,
  SearchIcon,
  AlertIcon,
  ClipboardIcon,
  GripIcon,
} from '@/components/Icons/Icons.tsx';

import type { JSX } from 'preact';

interface IconTestCase {
  name: string;
  Component: (props: Record<string, unknown>) => JSX.Element;
  defaultSize?: number;
}

const iconComponents: IconTestCase[] = [
  { name: 'PlusIcon', Component: PlusIcon },
  { name: 'CheckIcon', Component: CheckIcon },
  { name: 'TrashIcon', Component: TrashIcon },
  { name: 'EditIcon', Component: EditIcon },
  { name: 'CloseIcon', Component: CloseIcon },
  { name: 'ChevronDownIcon', Component: ChevronDownIcon },
  { name: 'HamburgerIcon', Component: HamburgerIcon },
  { name: 'SettingsIcon', Component: SettingsIcon },
  { name: 'DownloadIcon', Component: DownloadIcon },
  { name: 'UploadIcon', Component: UploadIcon },
  { name: 'ListIcon', Component: ListIcon },
  { name: 'SearchIcon', Component: SearchIcon },
  { name: 'ArrowUpIcon', Component: ArrowUpIcon },
  { name: 'ArrowDownIcon', Component: ArrowDownIcon },
  { name: 'GripIcon', Component: GripIcon, defaultSize: 18 },
  { name: 'AlertIcon', Component: AlertIcon },
  { name: 'ClipboardIcon', Component: ClipboardIcon },
];

describe('Icons', () => {
  describe.each(iconComponents)('$name', ({ Component, defaultSize }) => {
    it('renders an SVG element', () => {
      const { container } = render(<Component />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    });

    it('SVG has currentColor for theming', () => {
      const { container } = render(<Component />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('stroke')).toBe('currentColor');
    });

    it('SVG has aria-hidden attribute set to true by default', () => {
      const { container } = render(<Component />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('accepts custom size prop', () => {
      const { container } = render(<Component size={32} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('width')).toBe('32');
      expect(svg?.getAttribute('height')).toBe('32');
    });

    it(`uses default size of ${defaultSize ?? 24} when no size prop provided`, () => {
      const defaultSz = defaultSize ?? 24;
      const { container } = render(<Component />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('width')).toBe(String(defaultSz));
      expect(svg?.getAttribute('height')).toBe(String(defaultSz));
    });

    it('accepts className prop', () => {
      const { container } = render(<Component className="custom-icon" />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('class')).toContain('custom-icon');
    });

    it('has viewBox of 0 0 24 24', () => {
      const { container } = render(<Component />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });
  });

  describe('aria-hidden override', () => {
    it.each(iconComponents)('$name passes aria-hidden=false as attribute', ({ Component }) => {
      const { container } = render(<Component aria-hidden={false} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      // When aria-hidden=false is passed, it should render on the element
      // Preact renders the boolean false as the string "false"
      expect(svg?.getAttribute('aria-hidden')).toBe('false');
    });
  });
});
