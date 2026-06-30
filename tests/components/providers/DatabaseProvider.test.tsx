import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/preact';
import {
  DatabaseProvider,
  dbReady,
  dbError,
} from '@/components/providers/DatabaseProvider.tsx';

/**
 * We mock TodoDatabase so that new TodoDatabase() inside getDatabase()
 * returns a controllable mock object.
 *
 * Using a class whose constructor returns mockDb ensures new TodoDatabase()
 * correctly resolves to mockDb (constructors that return an object use it
 * as the result of `new`).
 */
const mockDb = vi.hoisted(() => {
  const m = {
    open: vi.fn(),
    ensureDefaultList: vi.fn(),
    getAllListStats: vi.fn(),
    getTasksForList: vi.fn(),
    tasks: { toArray: vi.fn() },
    lists: { toArray: vi.fn() },
  };
  m.open.mockResolvedValue(undefined);
  m.ensureDefaultList.mockResolvedValue({
    id: 'default-1',
    name: 'My Tasks',
    isDefault: true,
  });
  m.getAllListStats.mockResolvedValue(new Map());
  m.getTasksForList.mockResolvedValue([]);
  m.tasks.toArray.mockResolvedValue([]);
  m.lists.toArray.mockResolvedValue([]);
  return m;
});

vi.mock('@/db/todo-schema.ts', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal() as any;
  return {
    ...actual,
    TodoDatabase: class {
      constructor() {
        return mockDb;
      }
    },
  };
});

/**
 * Helper: create a plain Error with a custom name so the component's
 * `error instanceof Error` check passes in jsdom (jsdom's DOMException
 * is not instanceof Error).
 */
function namedError(name: string, message = ''): Error {
  const err = new Error(message);
  err.name = name;
  return err;
}

describe('DatabaseProvider', () => {
  beforeEach(() => {
    dbReady.value = false;
    dbError.value = null;
    mockDb.open.mockReset().mockResolvedValue(undefined);
    mockDb.ensureDefaultList.mockReset().mockResolvedValue({
      id: 'default-1',
      name: 'My Tasks',
      isDefault: true,
    });
    mockDb.getAllListStats.mockReset().mockResolvedValue(new Map());
    mockDb.getTasksForList.mockReset().mockResolvedValue([]);
    mockDb.tasks.toArray.mockReset().mockResolvedValue([]);
    mockDb.lists.toArray.mockReset().mockResolvedValue([]);
  });

  it('sets dbReady to true on successful initialization', async () => {
    render(
      <DatabaseProvider>
        <span>child</span>
      </DatabaseProvider>,
    );

    await waitFor(() => {
      expect(dbReady.value).toBe(true);
    });
    expect(dbError.value).toBeNull();
  });

  it('renders children', () => {
    const { container } = render(
      <DatabaseProvider>
        <span>child</span>
      </DatabaseProvider>,
    );
    expect(container.textContent).toBe('child');
  });

  describe('error handling', () => {
    it('sets dbError to "indexeddb-unavailable" on InvalidStateError', async () => {
      mockDb.open.mockRejectedValue(namedError('InvalidStateError'));

      render(<DatabaseProvider>test</DatabaseProvider>);

      await waitFor(() => {
        expect(dbError.value).toBe('indexeddb-unavailable');
      });
      expect(dbReady.value).toBe(false);
    });

    it('sets dbError to "indexeddb-unavailable" on SecurityError', async () => {
      mockDb.open.mockRejectedValue(namedError('SecurityError'));

      render(<DatabaseProvider>test</DatabaseProvider>);

      await waitFor(() => {
        expect(dbError.value).toBe('indexeddb-unavailable');
      });
      expect(dbReady.value).toBe(false);
    });

    it('sets dbError to "indexeddb-unavailable" when message includes "IndexedDB"', async () => {
      mockDb.open.mockRejectedValue(
        new Error('IndexedDB is not available in this browser'),
      );

      render(<DatabaseProvider>test</DatabaseProvider>);

      await waitFor(() => {
        expect(dbError.value).toBe('indexeddb-unavailable');
      });
      expect(dbReady.value).toBe(false);
    });

    it('sets dbError to "indexeddb-unavailable" when message includes "indexedDB"', async () => {
      mockDb.open.mockRejectedValue(new Error('indexedDB not found'));

      render(<DatabaseProvider>test</DatabaseProvider>);

      await waitFor(() => {
        expect(dbError.value).toBe('indexeddb-unavailable');
      });
      expect(dbReady.value).toBe(false);
    });

    it('sets dbError to "indexeddb-unavailable" when message includes "database"', async () => {
      mockDb.open.mockRejectedValue(new Error('database connection failed'));

      render(<DatabaseProvider>test</DatabaseProvider>);

      await waitFor(() => {
        expect(dbError.value).toBe('indexeddb-unavailable');
      });
      expect(dbReady.value).toBe(false);
    });

    it('sets dbError to the error message for a generic Error', async () => {
      mockDb.open.mockRejectedValue(new Error('Something went wrong'));

      render(<DatabaseProvider>test</DatabaseProvider>);

      await waitFor(() => {
        expect(dbError.value).toBe('Something went wrong');
      });
      expect(dbReady.value).toBe(false);
    });

    it('handles ensureDefaultList failure', async () => {
      mockDb.open.mockResolvedValue(undefined);
      mockDb.ensureDefaultList.mockRejectedValue(
        new Error('Failed to create default list'),
      );

      render(<DatabaseProvider>test</DatabaseProvider>);

      await waitFor(() => {
        expect(dbError.value).toBe('Failed to create default list');
      });
      expect(dbReady.value).toBe(false);
    });

    it('handles non-Error throwables', async () => {
      mockDb.open.mockRejectedValue('string error message');

      render(<DatabaseProvider>test</DatabaseProvider>);

      await waitFor(() => {
        expect(dbError.value).toBe('Failed to initialize database');
      });
      expect(dbReady.value).toBe(false);
    });
  });
});
