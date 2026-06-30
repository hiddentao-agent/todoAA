import { useState, useEffect, useRef } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { currentListId, selectList, createList, renameList, deleteListCascade } from '@/stores/listStore.ts';
import { MAX_LIST_NAME_LENGTH } from '@/db/todo-schema.ts';
import { listsWithCounts } from '@/stores/derived.ts';
import { sidebarOpen, closeSidebar, openSettings, showToast } from '@/stores/uiStore.ts';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.tsx';
import { estimateStorage, formatBytes } from '@/utils/storage.ts';
import { PlusIcon, CloseIcon, ListIcon, EditIcon, TrashIcon, SettingsIcon } from '@/components/Icons/Icons.tsx';
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
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create list');
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
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to rename list');
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
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete list');
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
            <CloseIcon size={24} />
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
              <ListIcon size={20} class={styles.listIcon} />

              {editing?.id === list.id ? (
                <input
                  class={styles.inlineEdit}
                  value={editName}
                  onInput={(e) => setEditName((e.target as HTMLInputElement).value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleRenameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  maxLength={MAX_LIST_NAME_LENGTH}
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
                    <EditIcon size={14} />
                  </button>
                  <button
                    class={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={(e) => { e.stopPropagation(); handleDeleteStart(list.id, list.name, list.total); }}
                    aria-label={`Delete list: ${list.name}`}
                  >
                    <TrashIcon size={14} />
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
              maxLength={MAX_LIST_NAME_LENGTH}
              aria-label="New list name"
            />
          ) : (
            <button class={styles.createBtn} onClick={() => setCreating(true)} aria-label="Create new list">
              <PlusIcon size={20} />
              New List
            </button>
          )}
        </div>

        <div class={styles.footer}>
          <span class={styles.storageInfo}>{storageText}</span>
          <button class={styles.settingsBtn} onClick={openSettings} aria-label="Open settings">
            <SettingsIcon size={20} />
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
