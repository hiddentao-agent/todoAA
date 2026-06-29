import { ThemeProvider } from '@/components/providers/ThemeProvider.tsx';
import { DatabaseProvider, dbReady, dbError } from '@/components/providers/DatabaseProvider.tsx';
import { AppShell } from '@/components/AppShell/AppShell.tsx';
import { TaskFormPanel } from '@/components/TaskForm/TaskFormPanel.tsx';
import { TaskListView } from '@/components/TaskList/TaskListView.tsx';
import { Toast } from '@/components/shared/Toast.tsx';

function Placeholder({ label }: { label: string }) {
  return (
    <div style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
      {label}
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        {dbError.value === 'indexeddb-unavailable' ? (
          <IndexedDBUnavailable />
        ) : dbError.value ? (
          <ErrorScreen message={dbError.value} />
        ) : (
          <>
            <AppShell
              sidebar={<Placeholder label="Lists — Phase 3" />}
              filterBar={<Placeholder label="Filter — Phase 4" />}
              sortControl={<Placeholder label="Sort — Phase 4" />}
              taskList={
                dbReady.value ? (
                  <TaskListView />
                ) : (
                  <InitialSkeleton />
                )
              }
            />
            <TaskFormPanel />
            <Toast />
          </>
        )}
      </DatabaseProvider>
    </ThemeProvider>
  );
}

function InitialSkeleton() {
  return (
    <div role="progressbar" aria-label="Loading tasks" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            marginBottom: '8px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            minHeight: '52px',
            opacity: 0.5 + (4 - i) * 0.15,
          }}
        >
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-bg)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '16px', width: `${60 + i * 12}%`, background: 'var(--color-bg)', borderRadius: '4px', marginBottom: '4px' }} />
            <div style={{ height: '12px', width: `${30 + i * 10}%`, background: 'var(--color-bg)', borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function IndexedDBUnavailable() {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px',
        textAlign: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--color-danger)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          fontSize: '32px',
          opacity: 0.8,
        }}
      >
        !
      </div>
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: '12px' }}>
        Storage Unavailable
      </h2>
      <p style={{ maxWidth: '400px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
        This app requires IndexedDB to store your data locally. Please disable private browsing or use a standard browser window.
      </p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px',
        textAlign: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: '12px' }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
    </div>
  );
}
