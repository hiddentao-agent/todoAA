import { useComputed } from '@preact/signals';
import { activeSort, sortDirection, setSort, toggleSortDirection } from '@/stores/uiStore.ts';
import type { SortMode } from '@/utils/storage-keys.ts';
import { ChevronDownIcon, ArrowUpIcon, ArrowDownIcon } from '@/components/Icons/Icons.tsx';
import styles from './SortControl.module.css';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'createdAt', label: 'Created' },
  { value: 'priority', label: 'Priority' },
];

export function SortControl() {
  const currentSort = useComputed(() => activeSort.value);
  const currentDir = useComputed(() => sortDirection.value);

  return (
    <div class={styles.container}>
      <select
        class={styles.select}
        value={currentSort.value}
        onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortMode)}
        aria-label="Sort by"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={16} />
      <button
        class={styles.directionBtn}
        onClick={toggleSortDirection}
        aria-label={`Sort ${currentDir.value === 'asc' ? 'ascending' : 'descending'}`}
      >
        {currentDir.value === 'asc' ? <ArrowUpIcon size={16} /> : <ArrowDownIcon size={16} />}
      </button>
    </div>
  );
}
