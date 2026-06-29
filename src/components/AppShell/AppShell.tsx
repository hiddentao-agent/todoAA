import { type ComponentChildren } from 'preact';
import { useComputed } from '@preact/signals';
import { sidebarOpen, toggleSidebar, openTaskForm } from '@/stores/uiStore.ts';
import { currentList } from '@/stores/listStore.ts';
import { currentListStats } from '@/stores/derived.ts';
import styles from './AppShell.module.css';

interface AppShellProps {
  sidebar: ComponentChildren;
  filterBar: ComponentChildren;
  sortControl: ComponentChildren;
  taskList: ComponentChildren;
}

export function AppShell({ sidebar, filterBar, sortControl, taskList }: AppShellProps) {
  const listTitle = useComputed(() => currentList.value?.name ?? 'Todo');
  const stats = useComputed(() => currentListStats.value);

  return (
    <div class={styles.shell}>
      {sidebar}
      <main class={styles.main} id="main-content">
        <div class={styles.contentHeader}>
          <button
            class={styles.sidebarToggle}
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <h1 class={styles.listTitle}>{listTitle}</h1>
          <span class={styles.taskCount} aria-live="polite">
            {stats.value.active} of {stats.value.total} active
          </span>
          <div class={styles.contentHeaderActions}>
            {filterBar}
            {sortControl}
          </div>
        </div>
        <div class={styles.taskArea}>
          {taskList}
        </div>
        <button
          onClick={() => openTaskForm()}
          aria-label="Create new task"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-text)',
            border: 'none',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            transition: 'background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </main>
    </div>
  );
}
