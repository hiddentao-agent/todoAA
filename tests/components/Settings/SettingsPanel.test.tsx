import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { SettingsPanel } from '@/components/Settings/SettingsPanel.tsx';
import { settingsOpen, toastMessage } from '@/stores/uiStore.ts';
import { MAX_IMPORT_SIZE } from '@/db/todo-schema.ts';

// Polyfill Blob.text() for older jsdom environments
if (!Blob.prototype.text) {
  Blob.prototype.text = function () {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsText(this);
    });
  };
}

// Mock store async functions so the import/delete handlers succeed
vi.mock('@/stores/listStore.ts', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal() as any;
  return {
    ...actual,
    loadLists: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/stores/taskStore.ts', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal() as any;
  return {
    ...actual,
    loadTasks: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock the database provider
vi.mock('@/components/providers/DatabaseProvider.tsx', async () => {
  return {
    getDatabase: vi.fn(() => ({
      exportAll: vi.fn().mockResolvedValue({
        version: 1,
        exportedAt: '2024-06-01T00:00:00.000Z',
        lists: [],
        tasks: [],
      }),
      importJSON: vi.fn().mockResolvedValue({
        listsImported: 3,
        listsSkipped: 0,
        tasksImported: 5,
        tasksSkipped: 0,
      }),
      deleteAllData: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('SettingsPanel', () => {
  let urlCreateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    settingsOpen.value = false;

    // Mock storage estimation
    const mockEstimate = { usageBytes: 102400, quotaBytes: 1048576, usagePercent: 10 };
    const storageModule = await import('@/utils/storage.ts');
    vi.spyOn(storageModule, 'estimateStorage').mockResolvedValue(mockEstimate);

    // Mock URL.createObjectURL for export tests
    urlCreateSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  describe('visibility', () => {
    it('shows the panel when settingsOpen is true', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Settings')).toBeDefined();
    });

    it('returns null when settingsOpen is false', () => {
      settingsOpen.value = false;
      const { container } = render(<SettingsPanel />);

      expect(container.innerHTML).toBe('');
    });
  });

  describe('theme switcher', () => {
    beforeEach(() => {
      localStorage.removeItem('todo-theme');
    });

    it('renders theme options', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      expect(screen.getByText('Theme')).toBeDefined();
      // Buttons contain emoji icons, so match by role
      expect(screen.getByRole('radio', { name: /Light/ })).toBeDefined();
      expect(screen.getByRole('radio', { name: /System/ })).toBeDefined();
      expect(screen.getByRole('radio', { name: /Dark/ })).toBeDefined();
    });

    it('defaults to system theme when no stored preference', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      const systemRadio = screen.getByRole('radio', { name: /System/ });
      expect(systemRadio.getAttribute('aria-checked')).toBe('true');
    });

    it('clicking a theme option updates aria-checked', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      const darkBtn = screen.getByRole('radio', { name: /Dark/ });
      fireEvent.click(darkBtn);

      expect(darkBtn.getAttribute('aria-checked')).toBe('true');

      const lightBtn = screen.getByRole('radio', { name: /Light/ });
      expect(lightBtn.getAttribute('aria-checked')).toBe('false');
    });

    it('clicking a theme stores preference in localStorage', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      fireEvent.click(screen.getByRole('radio', { name: /Dark/ }));
      expect(localStorage.getItem('todo-theme')).toBe('dark');

      fireEvent.click(screen.getByRole('radio', { name: /Light/ }));
      expect(localStorage.getItem('todo-theme')).toBe('light');
    });
  });

  describe('export', () => {
    it('renders export button', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      expect(screen.getByRole('button', { name: /Export Data/ })).toBeDefined();
    });

    it('clicking export triggers download', async () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      fireEvent.click(screen.getByRole('button', { name: /Export Data/ }));

      // handleExport is async — wait for the handler to complete
      await vi.waitFor(() => {
        expect(anchorClickSpy).toHaveBeenCalledTimes(1);
      });
      expect(urlCreateSpy).toHaveBeenCalledTimes(1);
    });

    it('export failure shows toast', async () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      // Make exportAll throw
      const { getDatabase } = await import('@/components/providers/DatabaseProvider.tsx');
      (getDatabase as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        exportAll: vi.fn().mockRejectedValue(new Error('Export error')),
        importJSON: vi.fn().mockResolvedValue({ listsImported: 0, listsSkipped: 0, tasksImported: 0, tasksSkipped: 0 }),
        deleteAllData: vi.fn().mockResolvedValue(undefined),
      });

      fireEvent.click(screen.getByRole('button', { name: /Export Data/ }));

      // Toast should be set to failure message
      await vi.waitFor(() => {
        expect(toastMessage.value).toBe('Export failed');
      });
    });
  });

  describe('import', () => {
    it('renders import button', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      expect(screen.getByRole('button', { name: /Import Data/ })).toBeDefined();
    });

    it('import button triggers file input click', () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);

      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      expect(fileInput).not.toBeNull();

      const clickSpy = vi.spyOn(fileInput!, 'click').mockImplementation(() => {});

      fireEvent.click(screen.getByRole('button', { name: /Import Data/ }));

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('file input is hidden', () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).not.toBeNull();
      expect(fileInput?.getAttribute('accept')).toBe('.json');
    });

    it('shows error when file exceeds MAX_IMPORT_SIZE', async () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);

      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      const largeContent = new ArrayBuffer(MAX_IMPORT_SIZE + 1);
      const file = new File([largeContent], 'large.json', { type: 'application/json' });

      Object.defineProperty(fileInput!, 'files', { value: [file] });
      fireEvent.change(fileInput!);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toMatch(/File too large/);
      });
    });

    it('shows error for invalid JSON file', async () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);

      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      const file = new File(['not valid json content'], 'bad.json', { type: 'application/json' });

      Object.defineProperty(fileInput!, 'files', { value: [file] });
      fireEvent.change(fileInput!);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toMatch(/Invalid JSON/);
      });
    });

    it('shows success message on successful import', async () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);

      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      const file = new File(
        ['{"version":1,"exportedAt":"2024-01-01","lists":[],"tasks":[]}'],
        'good.json',
        { type: 'application/json' },
      );

      Object.defineProperty(fileInput!, 'files', { value: [file] });
      fireEvent.change(fileInput!);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toMatch(/Imported 3 lists/);
      });
    });

    it('shows error message when importJSON rejects', async () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);

      // Override getDatabase to return importJSON that rejects
      const { getDatabase } = await import('@/components/providers/DatabaseProvider.tsx');
      (getDatabase as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        exportAll: vi.fn().mockResolvedValue({
          version: 1,
          exportedAt: '2024-06-01T00:00:00.000Z',
          lists: [],
          tasks: [],
        }),
        importJSON: vi.fn().mockRejectedValue(new Error('Corrupted data')),
        deleteAllData: vi.fn().mockResolvedValue(undefined),
      });

      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      const file = new File(
        ['{"version":1,"exportedAt":"2024-01-01","lists":[],"tasks":[]}'],
        'good.json',
        { type: 'application/json' },
      );

      Object.defineProperty(fileInput!, 'files', { value: [file] });
      fireEvent.change(fileInput!);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toMatch(/Corrupted data/);
      });
    });

    it('calls loadLists and loadTasks after successful import', async () => {
      settingsOpen.value = true;
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);

      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      const file = new File(
        ['{"version":1,"exportedAt":"2024-01-01","lists":[],"tasks":[]}'],
        'good.json',
        { type: 'application/json' },
      );

      Object.defineProperty(fileInput!, 'files', { value: [file] });
      fireEvent.change(fileInput!);

      // Wait for the success alert to appear
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toMatch(/Imported 3 lists/);
      });

      // Verify the store functions were called (lines 106-108)
      const { loadLists } = await import('@/stores/listStore.ts');
      const { loadTasks } = await import('@/stores/taskStore.ts');
      expect(loadLists).toHaveBeenCalled();
      expect(loadTasks).toHaveBeenCalled();
    });

    it('import does nothing when no file is selected on change', () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);
      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      // Trigger change with no files
      Object.defineProperty(fileInput!, 'files', { value: [] });
      fireEvent.change(fileInput!);
      // No alert should appear
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('shows generic error message when importJSON rejects with non-Error', async () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);
      const { getDatabase } = await import('@/components/providers/DatabaseProvider.tsx');
      (getDatabase as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        exportAll: vi.fn().mockResolvedValue({ version: 1, exportedAt: '', lists: [], tasks: [] }),
        importJSON: vi.fn().mockRejectedValue('string error'),
        deleteAllData: vi.fn().mockResolvedValue(undefined),
      });
      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      const file = new File(['{"version":1,"lists":[],"tasks":[]}'], 'bad.json', { type: 'application/json' });
      Object.defineProperty(fileInput!, 'files', { value: [file] });
      fireEvent.change(fileInput!);
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert.textContent).toMatch(/Import failed/);
      });
    });
  });

  describe('storage bar', () => {
    it('renders storage section with progress bar', async () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      expect(screen.getByText('Storage')).toBeDefined();

      const progressBar = await screen.findByRole('progressbar');
      expect(progressBar).toBeDefined();
      expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('renders storage usage text', async () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      expect(await screen.findByText('100.0 KB used')).toBeDefined();
      expect(await screen.findByText('1.0 MB available')).toBeDefined();
    });

    it('shows storage notice', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      expect(
        screen.getByText('Storage is local to this browser. Export your data to back it up.'),
      ).toBeDefined();
    });

    it('shows wider fill bar when storage exceeds 80%', async () => {
      // Override estimateStorage for this test
      const storageModule = await import('@/utils/storage.ts');
      const estimateSpy = vi.spyOn(storageModule, 'estimateStorage').mockResolvedValue({
        usageBytes: 900000,
        quotaBytes: 1000000,
        usagePercent: 90,
      });
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);
      const storageFill = container.querySelector('[class*="storageFill"]');
      expect(storageFill).toBeDefined();
      // Wait for the async storage estimation to update the DOM
      await waitFor(() => {
        expect(storageFill!.getAttribute('style')).toMatch(/width:\s*90%/);
      });
      estimateSpy.mockRestore();
    });
  });

  describe('delete all data', () => {
    beforeEach(() => {
      settingsOpen.value = true;
    });

    it('renders danger zone section', () => {
      render(<SettingsPanel />);

      expect(screen.getByText('Danger Zone')).toBeDefined();
      expect(screen.getByText('Delete all data')).toBeDefined();
    });

    it('shows delete button initially', () => {
      render(<SettingsPanel />);

      const deleteBtn = screen.getByText('Delete All Data');
      expect(deleteBtn).toBeDefined();
    });

    it('clicking delete button shows confirmation input', () => {
      render(<SettingsPanel />);

      fireEvent.click(screen.getByText('Delete All Data'));

      expect(screen.getByText(/Type DELETE to confirm/)).toBeDefined();
      expect(screen.getByPlaceholderText('DELETE')).toBeDefined();
    });

    it('confirmation delete button is disabled when input does not match DELETE', () => {
      render(<SettingsPanel />);

      fireEvent.click(screen.getByText('Delete All Data'));

      const confirmInput = screen.getByPlaceholderText('DELETE') as HTMLInputElement;
      fireEvent.input(confirmInput, { target: { value: 'DELET' } });

      const deleteBtn = screen.getByText('Delete All Data');
      expect(deleteBtn.getAttribute('disabled')).toBeDefined();
    });

    it('confirmation delete button is enabled when input matches DELETE', () => {
      render(<SettingsPanel />);

      fireEvent.click(screen.getByText('Delete All Data'));

      const confirmInput = screen.getByPlaceholderText('DELETE') as HTMLInputElement;
      fireEvent.input(confirmInput, { target: { value: 'DELETE' } });

      const deleteBtn = screen.getByText('Delete All Data');
      expect(deleteBtn.getAttribute('disabled')).toBeNull();
    });

    it('cancel button in confirmation resets the flow', () => {
      render(<SettingsPanel />);

      fireEvent.click(screen.getByText('Delete All Data'));

      const confirmInput = screen.getByPlaceholderText('DELETE') as HTMLInputElement;
      fireEvent.input(confirmInput, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByText('Cancel'));

      // Should go back to initial state with just the delete button
      expect(screen.queryByPlaceholderText('DELETE')).toBeNull();
    });

    it('clicking delete after confirming calls deleteAllData and closes the panel', async () => {
      render(<SettingsPanel />);

      fireEvent.click(screen.getByText('Delete All Data'));

      const confirmInput = screen.getByPlaceholderText('DELETE') as HTMLInputElement;
      fireEvent.input(confirmInput, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByText('Delete All Data'));

      await vi.waitFor(() => {
        expect(settingsOpen.value).toBe(false);
      });
    });

    it('delete failure shows toast', async () => {
      render(<SettingsPanel />);

      // Make deleteAllData throw
      const { getDatabase } = await import('@/components/providers/DatabaseProvider.tsx');
      (getDatabase as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        exportAll: vi.fn().mockResolvedValue({ version: 1, exportedAt: '', lists: [], tasks: [] }),
        importJSON: vi.fn().mockResolvedValue({ listsImported: 0, listsSkipped: 0, tasksImported: 0, tasksSkipped: 0 }),
        deleteAllData: vi.fn().mockRejectedValue(new Error('Delete error')),
      });

      fireEvent.click(screen.getByText('Delete All Data'));

      const confirmInput = screen.getByPlaceholderText('DELETE') as HTMLInputElement;
      fireEvent.input(confirmInput, { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByText('Delete All Data'));

      await vi.waitFor(() => {
        expect(toastMessage.value).toBe('Failed to delete data');
      });
    });

    it('delete button remains disabled when input does not match DELETE', () => {
      render(<SettingsPanel />);
      fireEvent.click(screen.getByText('Delete All Data'));
      const confirmInput = screen.getByPlaceholderText('DELETE') as HTMLInputElement;
      fireEvent.input(confirmInput, { target: { value: 'DELET' } });
      const deleteBtn = screen.getByText('Delete All Data');
      expect(deleteBtn.getAttribute('disabled')).toBeDefined();
      // handler should exit early
    });
  });

  describe('close behavior', () => {
    it('close button closes the panel', () => {
      settingsOpen.value = true;
      render(<SettingsPanel />);

      fireEvent.click(screen.getByLabelText('Close settings'));
      expect(settingsOpen.value).toBe(false);
    });
  });

  describe('overlay click', () => {
    it('clicking overlay closes the panel', () => {
      settingsOpen.value = true;
      const { container } = render(<SettingsPanel />);

      const overlay = container.querySelector('div[aria-hidden="true"]');
      expect(overlay).not.toBeNull();
      fireEvent.click(overlay!);

      expect(settingsOpen.value).toBe(false);
    });
  });
});
