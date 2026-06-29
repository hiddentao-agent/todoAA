import { useComputed } from '@preact/signals';
import { activeFilter, setFilter } from '@/stores/uiStore.ts';
import { currentListStats } from '@/stores/derived.ts';
import styles from './FilterBar.module.css';

type FilterValue = 'all' | 'active' | 'completed';

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function FilterBar() {
  const stats = useComputed(() => currentListStats.value);
  const currentFilter = useComputed(() => activeFilter.value);

  return (
    <div class={styles.container} role="tablist" aria-label="Filter tasks">
      {FILTERS.map((f) => {
        const count = f.value === 'all'
          ? stats.value.total
          : f.value === 'active'
            ? stats.value.active
            : stats.value.completed;

        return (
          <button
            key={f.value}
            class={`${styles.tab} ${currentFilter.value === f.value ? styles.active : ''}`}
            role="tab"
            aria-selected={currentFilter.value === f.value}
            aria-label={`${f.label}, ${count} tasks`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span class={styles.count}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
