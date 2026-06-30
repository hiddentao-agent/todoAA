import { AlertIcon, CloseIcon } from '@/components/Icons/Icons.tsx';
import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
}

export function ErrorBanner({ message, onDismiss, action }: ErrorBannerProps) {
  return (
    <div class={styles.banner} role="alert">
      <AlertIcon size={20} class={styles.icon} />
      <span class={styles.message}>{message}</span>
      {action && (
        <button class={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button class={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}
