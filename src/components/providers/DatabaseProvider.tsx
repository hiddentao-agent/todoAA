import { useEffect } from 'preact/hooks';
import { type ComponentChildren } from 'preact';
import { TodoDatabase } from '@/db/todo-schema.ts';
import { initializeListStore, loadLists } from '@/stores/listStore.ts';
import { initializeTaskStore, loadTasks } from '@/stores/taskStore.ts';
import { loadSortPreference } from '@/stores/uiStore.ts';
import { requestPersistentStorage } from '@/utils/storage.ts';
import { signal } from '@preact/signals';

// Singleton database instance
let dbInstance: TodoDatabase | null = null;

export function getDatabase(): TodoDatabase {
  if (!dbInstance) {
    dbInstance = new TodoDatabase();
  }
  return dbInstance;
}

export const dbReady = signal<boolean>(false);
export const dbError = signal<string | null>(null);

interface DatabaseProviderProps {
  children: ComponentChildren;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  useEffect(() => {
    const init = async () => {
      try {
        const db = getDatabase();

        // Open the database (single open — if this fails, IndexedDB is unavailable)
        await db.open();

        // Ensure default list exists
        await db.ensureDefaultList();

        // Initialize stores
        initializeListStore(db);
        initializeTaskStore(db);

        // Load data
        await loadLists();
        await loadTasks();
        loadSortPreference();

        dbReady.value = true;

        // Request persistent storage so the browser doesn't evict data
        // under storage pressure (spec §7.2, Phase 5 task 10).
        await requestPersistentStorage();
      } catch (error) {
        if (error instanceof Error) {
          // Check if IndexedDB is unavailable
          if (
            error.name === 'InvalidStateError' ||
            error.name === 'SecurityError' ||
            error.message?.includes('indexedDB') ||
            error.message?.includes('IndexedDB') ||
            error.message?.includes('database')
          ) {
            dbError.value = 'indexeddb-unavailable';
          } else {
            dbError.value = error.message;
          }
        } else {
          dbError.value = 'Failed to initialize database';
        }
      }
    };

    init();
  }, []);

  return <>{children}</>;
}
