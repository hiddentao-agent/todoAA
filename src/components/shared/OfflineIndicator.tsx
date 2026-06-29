import { useState, useEffect } from 'preact/hooks';

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    setOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '8px 16px',
        background: 'var(--color-warning)',
        color: 'white',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        textAlign: 'center',
      }}
    >
      You are offline. Changes will be saved locally.
    </div>
  );
}
