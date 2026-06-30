import { useState, useEffect } from 'preact/hooks';

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check if there's a waiting worker already
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'var(--color-surface)',
        border: 'var(--border-thin)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: 'var(--text-sm)',
        whiteSpace: 'nowrap',
      }}
      role="alert"
    >
      <span>A new version is available.</span>
      <button
        onClick={handleUpdate}
        style={{
          padding: '6px 16px',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-text)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          cursor: 'pointer',
          minHeight: '36px',
        }}
      >
        Update
      </button>
      <button
        onClick={() => setUpdateAvailable(false)}
        style={{
          padding: '6px 12px',
          background: 'none',
          border: 'none',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          cursor: 'pointer',
          minHeight: '36px',
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
