import { useState, useEffect, useRef } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { currentListId, selectList, createList, renameList, deleteListCascade } from '@/stores/listStore.ts';
import { listsWithCounts } from '@/stores/derived.ts';
import { sidebarOpen, closeSidebar, openSettings } from '@/stores/uiStore.ts';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.tsx';
import { estimateStorage, formatBytes } from '@/utils/storage.ts';
import styles from './Sidebar.module.css';

interface EditingList {
  id: string;
  name: string;
}

interface DeleteTarget {
  id: string;
  name: string;
  taskCount: number;
}

export function Sidebar() {
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editing, setEditing] = useState<EditingList | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [storageText, setStorageText] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);

  const open = sidebarOpen.value;
  const enriched = useComputed(() => listsWithCounts.value);

  useEffect(() => {
    estimateStorage().then((est) => {
      setStorageText(`${formatBytes(est.usageBytes)} used`);
    });
  }, []);

  useEffect(() => {
    if (creating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [creating]);

  const handleSelect = (id: string) => {
    selectList(id);
    closeSidebar();
  };

  const handleCreate = async () => {
    const name = newListName.trim();
    if (!name) return;
    try {
      await createList(name);
      setNewListName('');
      setCreating(false);
    } catch {
      // silently fail — createList validates
    }
  };

  const handleCreateKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') {
      setNewListName('');
      setCreating(false);
    }
  };

  const handleRenameStart = (list: { id: string; name: string }) => {
    setEditing({ id: list.id, name: list.name });
    setEditName(list.name);
  };

  const handleRenameSubmit = async () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name || name === editing.name) {
      setEditing(null);
      return;
    }
    try {
      await renameList(editing.id, name);
    } catch {
      // fail silently
    }
    setEditing(null);
  };

  const handleRenameKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setEditing(null);
  };

  const handleDeleteStart = (id: string, name: string, taskCount: number) => {
    setDeleteTarget({ id, name, taskCount });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteListCascade(deleteTarget.id);
    } catch {
      // fail silently
    }
    setDeleteTarget(null);
  };

  const handleOverlayClick = () => {
    closeSidebar();
  };

  return (
    <>
      {open && <div class={styles.overlay} onClick={handleOverlayClick} aria-hidden="true" />}

      <aside
        id="sidebar"
        class={`${styles.sidebar} ${open ? styles.open : ''}`}
        aria-label="Lists"
      >
        <div class={styles.header}>
          <span class={styles.appTitle}>Todo</span>
          <button class={styles.closeBtn} onClick={closeSidebar} aria-label="Close sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav class={styles.listsNav} aria-label="Lists">
          {enriched.value.map((list) => (
            <div
              key={list.id}
              class={`${styles.listItem} ${list.id === currentListId.value ? styles.listItemActive : ''}`}
              onClick={() => handleSelect(list.id)}
              role="option"
              aria-selected={list.id === currentListId.value}
              aria-label={`${list.name} — ${list.active} tasks`}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSelect(list.id); }}
            >
              <svg class={styles.listIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>

              {editing?.id === list.id ? (
                <input
                  class={styles.inlineEdit}
                  value={editName}
                  onInput={(e) => setEditName((e.target as HTMLInputElement).value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleRenameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  maxLength={200}
                />
              ) : (
                <span class={styles.listName}>{list.name}</span>
              )}

              <span class={styles.badge}>{list.active}</span>

              {!list.isDefault && editing?.id !== list.id && (
                <div class={styles.listActions}>
                  <button
                    class={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); handleRenameStart({ id: list.id, name: list.name }); }}
                    aria-label={`Rename list: ${list.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    class={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={(e) => { e.stopPropagation(); handleDeleteStart(list.id, list.name, list.total); }}
                    aria-label={`Delete list: ${list.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div class={styles.createSection}>
          {creating ? (
            <input
              ref={createInputRef}
              class={styles.createInput}
              type="text"
              value={newListName}
              onInput={(e) => setNewListName((e.target as HTMLInputElement).value)}
              onBlur={() => { if (!newListName.trim()) setCreating(false); }}
              onKeyDown={handleCreateKeyDown}
              placeholder="List name"
              maxLength={200}
              aria-label="New list name"
            />
          ) : (
            <button class={styles.createBtn} onClick={() => setCreating(true)} aria-label="Create new list">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New List
            </button>
          )}
        </div>

        <div class={styles.footer}>
          <span class={styles.storageInfo}>{storageText}</span>
          <button class={styles.settingsBtn} onClick={openSettings} aria-label="Open settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </aside>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete list '${deleteTarget.name}'?`}
          message={`This will permanently delete this list and all ${deleteTarget.taskCount} tasks in it. This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
