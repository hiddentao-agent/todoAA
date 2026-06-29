import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}

export function ErrorBanner({ message, onDismiss, action }: ErrorBannerProps) {
  return (
    <div class={styles.banner} role="alert">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class={styles.icon}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span class={styles.message}>{message}</span>
      {action && (
        <button class={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button class={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
