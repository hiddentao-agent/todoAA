import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  announcerMessage,
  announce,
  activeFilter,
  activeSort,
  sortDirection,
  sidebarOpen,
  settingsOpen,
  taskFormOpen,
  editingTaskId,
  toastMessage,
  setFilter,
  setSort,
  toggleSortDirection,
  toggleSidebar,
  closeSidebar,
  openSettings,
  closeSettings,
  openTaskForm,
  closeTaskForm,
  showToast,
  loadSortPreference,
} from '@/stores/uiStore.ts';
import { STORAGE_KEY_SORT } from '@/utils/storage-keys.ts';

/* ------------------------------------------------------------------ */
/*  Utility: clear all signal state before each test                   */
/* ------------------------------------------------------------------ */

function resetSignals() {
  activeFilter.value = 'all';
  activeSort.value = 'manual';
  sortDirection.value = 'asc';
  sidebarOpen.value = false;
  settingsOpen.value = false;
  taskFormOpen.value = false;
  editingTaskId.value = null;
  toastMessage.value = null;
  announcerMessage.value = '';
}

/* ------------------------------------------------------------------ */
/*  setFilter                                                          */
/* ------------------------------------------------------------------ */

describe('setFilter', () => {
  beforeEach(() => {
    resetSignals();
  });

  it('changes activeFilter to active', () => {
    setFilter('active');
    expect(activeFilter.value).toBe('active');
  });

  it('changes activeFilter to completed', () => {
    setFilter('completed');
    expect(activeFilter.value).toBe('completed');
  });

  it('changes activeFilter back to all', () => {
    setFilter('active');
    setFilter('all');
    expect(activeFilter.value).toBe('all');
  });
});

/* ------------------------------------------------------------------ */
/*  setSort                                                            */
/* ------------------------------------------------------------------ */

describe('setSort', () => {
  beforeEach(() => {
    resetSignals();
    localStorage.clear();
  });

  it('sets activeSort signal', () => {
    setSort('dueDate');
    expect(activeSort.value).toBe('dueDate');
  });

  it('writes the sort value to localStorage', () => {
    setSort('priority');
    expect(localStorage.getItem(STORAGE_KEY_SORT)).toBe('priority');
  });

  it('persists different sort modes', () => {
    setSort('dueDate');
    expect(localStorage.getItem(STORAGE_KEY_SORT)).toBe('dueDate');

    setSort('createdAt');
    expect(localStorage.getItem(STORAGE_KEY_SORT)).toBe('createdAt');

    setSort('manual');
    expect(localStorage.getItem(STORAGE_KEY_SORT)).toBe('manual');
  });
});

/* ------------------------------------------------------------------ */
/*  toggleSortDirection                                                */
/* ------------------------------------------------------------------ */

describe('toggleSortDirection', () => {
  beforeEach(() => {
    resetSignals();
  });

  it('flips asc to desc', () => {
    sortDirection.value = 'asc';
    toggleSortDirection();
    expect(sortDirection.value).toBe('desc');
  });

  it('flips desc to asc', () => {
    sortDirection.value = 'desc';
    toggleSortDirection();
    expect(sortDirection.value).toBe('asc');
  });

  it('toggles repeatedly', () => {
    toggleSortDirection(); // asc -> desc
    expect(sortDirection.value).toBe('desc');
    toggleSortDirection(); // desc -> asc
    expect(sortDirection.value).toBe('asc');
    toggleSortDirection(); // asc -> desc
    expect(sortDirection.value).toBe('desc');
  });
});

/* ------------------------------------------------------------------ */
/*  toggleSidebar / closeSidebar                                       */
/* ------------------------------------------------------------------ */

describe('toggleSidebar', () => {
  beforeEach(() => {
    resetSignals();
  });

  it('opens a closed sidebar', () => {
    sidebarOpen.value = false;
    toggleSidebar();
    expect(sidebarOpen.value).toBe(true);
  });

  it('closes an open sidebar', () => {
    sidebarOpen.value = true;
    toggleSidebar();
    expect(sidebarOpen.value).toBe(false);
  });
});

describe('closeSidebar', () => {
  beforeEach(() => {
    resetSignals();
  });

  it('sets sidebarOpen to false', () => {
    sidebarOpen.value = true;
    closeSidebar();
    expect(sidebarOpen.value).toBe(false);
  });

  it('is idempotent when already closed', () => {
    sidebarOpen.value = false;
    closeSidebar();
    expect(sidebarOpen.value).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  openSettings / closeSettings                                       */
/* ------------------------------------------------------------------ */

describe('openSettings', () => {
  beforeEach(() => {
    resetSignals();
  });

  it('sets settingsOpen to true', () => {
    openSettings();
    expect(settingsOpen.value).toBe(true);
  });
});

describe('closeSettings', () => {
  beforeEach(() => {
    resetSignals();
  });

  it('sets settingsOpen to false', () => {
    settingsOpen.value = true;
    closeSettings();
    expect(settingsOpen.value).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  openTaskForm / closeTaskForm                                       */
/* ------------------------------------------------------------------ */

describe('openTaskForm', () => {
  beforeEach(() => {
    resetSignals();
  });

  it('sets taskFormOpen to true', () => {
    openTaskForm();
    expect(taskFormOpen.value).toBe(true);
  });

  it('sets editingTaskId when a taskId is provided', () => {
    openTaskForm('task-123');
    expect(editingTaskId.value).toBe('task-123');
    expect(taskFormOpen.value).toBe(true);
  });

  it('does not set editingTaskId when no taskId is provided', () => {
    openTaskForm();
    expect(editingTaskId.value).toBeNull();
    expect(taskFormOpen.value).toBe(true);
  });
});

describe('closeTaskForm', () => {
  beforeEach(() => {
    resetSignals();
  });

  it('sets taskFormOpen to false', () => {
    taskFormOpen.value = true;
    closeTaskForm();
    expect(taskFormOpen.value).toBe(false);
  });

  it('clears editingTaskId', () => {
    taskFormOpen.value = true;
    editingTaskId.value = 'task-123';
    closeTaskForm();
    expect(editingTaskId.value).toBeNull();
    expect(taskFormOpen.value).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  announce                                                          */
/* ------------------------------------------------------------------ */

describe('announce', () => {
  beforeEach(() => {
    announcerMessage.value = '';
  });

  it('sets the announcer message', async () => {
    announce('Task created');
    await new Promise((r) => requestAnimationFrame(r));
    expect(announcerMessage.value).toBe('Task created');
  });

  it('re-triggers for the same message', async () => {
    announce('Task saved');
    await new Promise((r) => requestAnimationFrame(r));
    expect(announcerMessage.value).toBe('Task saved');

    // Same message should still work
    announce('Task saved');
    await new Promise((r) => requestAnimationFrame(r));
    expect(announcerMessage.value).toBe('Task saved');
  });

  it('clears message first so same message re-triggers', async () => {
    announce('hello');
    await new Promise((r) => requestAnimationFrame(r));
    // After rAF the value is set
    expect(announcerMessage.value).toBe('hello');

    // On next announce, it first clears
    announce('world');
    // After synchronous clear
    expect(announcerMessage.value).toBe('');
    await new Promise((r) => requestAnimationFrame(r));
    expect(announcerMessage.value).toBe('world');
  });
});

/* ------------------------------------------------------------------ */
/*  showToast                                                          */
/* ------------------------------------------------------------------ */

describe('showToast', () => {
  beforeEach(() => {
    resetSignals();
    // Only fake setTimeout — leave rAF real so announce tests still work
    vi.useFakeTimers({ toFake: ['setTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets toastMessage', () => {
    showToast('Task deleted');
    expect(toastMessage.value).toBe('Task deleted');
  });

  it('clears toastMessage after 2 seconds', () => {
    showToast('Task deleted');
    expect(toastMessage.value).toBe('Task deleted');

    vi.advanceTimersByTime(2000);
    expect(toastMessage.value).toBeNull();
  });

  it('does not clear toastMessage if it was replaced', () => {
    showToast('First message');

    // Advance only partway through the first timeout, then replace
    vi.advanceTimersByTime(1000);
    showToast('Second message');
    expect(toastMessage.value).toBe('Second message');

    // Advance past the first toast's 2s timeout (1s remaining + 1s extra)
    // The first timeout fires but sees message changed, so doesn't clear
    vi.advanceTimersByTime(1000);
    expect(toastMessage.value).toBe('Second message');

    // Advance past the second toast's 2s timeout (started when showToast called)
    vi.advanceTimersByTime(1000);
    // The second timeout fires and clears because it still matches
    expect(toastMessage.value).toBeNull();
  });

  it('calls announce with the same message', async () => {
    showToast('Task archived');
    // announce was called synchronously but sets announcerMessage after rAF
    await new Promise((r) => requestAnimationFrame(r));
    expect(announcerMessage.value).toBe('Task archived');
  });
});

/* ------------------------------------------------------------------ */
/*  loadSortPreference                                                 */
/* ------------------------------------------------------------------ */

describe('loadSortPreference', () => {
  beforeEach(() => {
    resetSignals();
    localStorage.clear();
  });

  it('loads stored sort preference from localStorage', () => {
    localStorage.setItem(STORAGE_KEY_SORT, 'dueDate');
    loadSortPreference();
    expect(activeSort.value).toBe('dueDate');
  });

  it('does not change activeSort for invalid values', () => {
    localStorage.setItem(STORAGE_KEY_SORT, 'invalid-value');
    activeSort.value = 'manual';
    loadSortPreference();
    // activeSort should remain unchanged ('manual')
    expect(activeSort.value).toBe('manual');
  });

  it('does not change activeSort when localStorage is empty', () => {
    activeSort.value = 'manual';
    loadSortPreference();
    expect(activeSort.value).toBe('manual');
  });

  it('accepts all valid sort modes', () => {
    const validModes = ['manual', 'dueDate', 'createdAt', 'priority'] as const;
    for (const mode of validModes) {
      localStorage.setItem(STORAGE_KEY_SORT, mode);
      loadSortPreference();
      expect(activeSort.value).toBe(mode);
    }
  });
});
