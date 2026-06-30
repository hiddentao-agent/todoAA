import { useState, useEffect, useRef } from 'preact/hooks';
import { useFocusTrap } from '@/hooks/useFocusTrap.ts';
import { settingsOpen, closeSettings, showToast } from '@/stores/uiStore.ts';
import { loadLists } from '@/stores/listStore.ts';
import { loadTasks } from '@/stores/taskStore.ts';
import { getDatabase } from '@/components/providers/DatabaseProvider.tsx';
import { getStoredTheme, setStoredTheme } from '@/components/providers/ThemeProvider.tsx';
import { CloseIcon, DownloadIcon, UploadIcon } from '@/components/Icons/Icons.tsx';
import { estimateStorage, formatBytes } from '@/utils/storage.ts';
import type { ThemePreference } from '@/utils/storage-keys.ts';
import styles from './SettingsPanel.module.css';

const THEMES: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀' },
  { value: 'system', label: 'System', icon: '🌓' },
  { value: 'dark', label: 'Dark', icon: '☾' },
];

export function SettingsPanel() {
  const [theme, setTheme] = useState<ThemePreference>(getStoredTheme());
  const [storagePercent, setStoragePercent] = useState(0);
  const [storageUsed, setStorageUsed] = useState('');
  const [storageQuota, setStorageQuota] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap(settingsOpen.value, closeSettings);

  useEffect(() => {
    if (settingsOpen.value) {
      setTheme(getStoredTheme());
      updateStorage();
      setImportStatus(null);
    }
  }, [settingsOpen.value]);

  const updateStorage = async () => {
    const est = await estimateStorage();
    setStoragePercent(est.usagePercent);
    setStorageUsed(formatBytes(est.usageBytes));
    setStorageQuota(formatBytes(est.quotaBytes));
  };

  const handleThemeChange = (pref: ThemePreference) => {
    setTheme(pref);
    setStoredTheme(pref);
  };

  const handleExport = async () => {
    try {
      const db = getDatabase();
      const data = await db.exportAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `todo-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported');
    } catch {
      showToast('Export failed');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setImportStatus(null);

    try {
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        setImportStatus({
          type: 'error',
          message: `File too large (${formatBytes(file.size)}). Maximum is 5 MB.`,
        });
        return;
      }

      const text = await file.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        setImportStatus({ type: 'error', message: 'Invalid JSON: the file is not valid JSON.' });
        return;
      }

      const db = getDatabase();
      const result = await db.importJSON(data as Parameters<typeof db.importJSON>[0]);
      setImportStatus({
        type: 'success',
        message: `Imported ${result.listsImported} list${result.listsImported !== 1 ? 's' : ''} and ${result.tasksImported} task${result.tasksImported !== 1 ? 's' : ''}. ${result.listsSkipped + result.tasksSkipped} duplicate${result.listsSkipped + result.tasksSkipped !== 1 ? 's' : ''} skipped.`,
      });
      await Promise.all([loadLists(), loadTasks()]);
      await updateStorage();
      showToast('Data imported');
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Import failed',
      });
    }

    // Reset file input
    input.value = '';
  };

  const handleDeleteAll = async () => {
    if (deleteInput !== 'DELETE') return;

    try {
      const db = getDatabase();
      await db.deleteAllData();
      await Promise.all([loadLists(), loadTasks()]);
      setDeleteConfirming(false);
      setDeleteInput('');
      showToast('All data deleted');
      closeSettings();
    } catch {
      showToast('Failed to delete data');
    }
  };

  const handleOverlayClick = () => {
    closeSettings();
  };

  if (!settingsOpen.value) return null;

  return (
    <>
      <div class={styles.overlay} onClick={handleOverlayClick} aria-hidden="true" />
      <div
        class={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        ref={trapRef}
      >
        <div class={styles.header}>
          <h2 class={styles.title} id="settings-title">Settings</h2>
          <button class={styles.closeBtn} onClick={closeSettings} aria-label="Close settings">
            <CloseIcon size={24} />
          </button>
        </div>
        <div class={styles.body}>
          {/* Theme */}
          <section>
            <h3 class={styles.sectionTitle}>Theme</h3>
            <div class={styles.themeSegment} role="radiogroup" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  class={`${styles.themeBtn} ${theme === t.value ? styles.themeBtnActive : ''}`}
                  role="radio"
                  aria-checked={theme === t.value}
                  onClick={() => handleThemeChange(t.value)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Data */}
          <section>
            <h3 class={styles.sectionTitle}>Data</h3>
            <div class={styles.dataActions}>
              <button class={styles.exportBtn} onClick={handleExport}>
                <DownloadIcon size={18} />
                Export Data
              </button>
              <button class={styles.importBtn} onClick={handleImportClick}>
                <UploadIcon size={18} />
                Import Data
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                class={styles.fileInput}
                onChange={handleImportFile}
                aria-label="Select JSON file to import"
              />
            </div>
            {importStatus && (
              <div class={importStatus.type === 'error' ? styles.importError : styles.importSuccess} role="alert">
                {importStatus.message}
              </div>
            )}
          </section>

          {/* Storage */}
          <section>
            <h3 class={styles.sectionTitle}>Storage</h3>
            <div
              class={styles.storageBar}
              role="progressbar"
              aria-valuenow={storagePercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Storage used"
            >
              <div
                class={`${styles.storageFill} ${storagePercent > 80 ? styles.storageFillWarning : ''} ${storagePercent > 95 ? styles.storageFillDanger : ''}`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
            <div class={styles.storageStats}>
              <span>{storageUsed} used</span>
              <span>{storageQuota} available</span>
            </div>
            <p class={styles.storageNotice}>
              Storage is local to this browser. Export your data to back it up.
            </p>
          </section>

          {/* Danger Zone */}
          <section>
            <h3 class={styles.sectionTitle}>Danger Zone</h3>
            <div class={styles.dangerZone}>
              <h4 class={styles.dangerTitle}>Delete all data</h4>
              <p class={styles.dangerDesc}>
                This permanently deletes all lists and tasks from this browser. This action cannot be undone.
              </p>
              {!deleteConfirming ? (
                <button class={styles.dangerBtn} onClick={() => setDeleteConfirming(true)}>
                  Delete All Data
                </button>
              ) : (
                <div class={styles.confirmInput}>
                  <label class={styles.confirmLabel}>
                    Type DELETE to confirm:
                  </label>
                  <input
                    class={styles.confirmTextInput}
                    type="text"
                    value={deleteInput}
                    onInput={(e) => setDeleteInput((e.target as HTMLInputElement).value)}
                    placeholder="DELETE"
                    autofocus
                  />
                  <div class={styles.confirmActions}>
                    <button class={styles.cancelConfirmBtn} onClick={() => { setDeleteConfirming(false); setDeleteInput(''); }}>
                      Cancel
                    </button>
                    <button
                      class={styles.dangerBtn}
                      onClick={handleDeleteAll}
                      disabled={deleteInput !== 'DELETE'}
                    >
                      Delete All Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
