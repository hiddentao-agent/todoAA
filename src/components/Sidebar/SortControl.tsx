import { useComputed } from '@preact/signals';
import { activeSort, sortDirection, setSort, toggleSortDirection } from '@/stores/uiStore.ts';
import type { SortMode } from '@/utils/storage-keys.ts';
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
      <button
        class={styles.directionBtn}
        onClick={toggleSortDirection}
        aria-label={`Sort ${currentDir.value === 'asc' ? 'ascending' : 'descending'}`}
      >
        {currentDir.value === 'asc' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        )}
      </button>
    </div>
  );
}
