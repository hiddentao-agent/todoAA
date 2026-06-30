import { toastMessage } from '@/stores/uiStore.ts';
import styles from './Toast.module.css';

export function Toast() {
  const message = toastMessage.value;

  if (!message) return null;

  return (
    <div class={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}
