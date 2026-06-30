import type { JSX } from 'preact';

interface IconProps {
  size?: number;
  class?: string;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

type SvgProps = IconProps & Omit<JSX.SVGAttributes<SVGSVGElement>, 'size'>;

function svgProps(size: number, props: SvgProps): JSX.SVGAttributes<SVGSVGElement> {
  const { class: cls, className, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round' as const,
    'stroke-linejoin': 'round' as const,
    class: className ?? cls,
    'aria-hidden': props['aria-hidden'] === false ? undefined : true,
    ...rest,
  };
}

export function PlusIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function TrashIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function EditIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function CloseIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ArrowUpIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export function ArrowDownIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

export function HamburgerIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function SettingsIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function DownloadIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function UploadIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function ListIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

export function SearchIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function AlertIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function ClipboardIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

export function GripIcon({ size = 18, ...props }: SvgProps) {
  return (
    <svg {...svgProps(size, props)}>
      <circle cx="5" cy="3" r="1.5" />
      <circle cx="13" cy="3" r="1.5" />
      <circle cx="5" cy="9" r="1.5" />
      <circle cx="13" cy="9" r="1.5" />
      <circle cx="5" cy="15" r="1.5" />
      <circle cx="13" cy="15" r="1.5" />
    </svg>
  );
}

