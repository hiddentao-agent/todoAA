import { useFocusTrap } from '@/hooks/useFocusTrap.ts';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const trapRef = useFocusTrap(true, onCancel);

  return (
    <>
      <div class={styles.overlay} onClick={onCancel} aria-hidden="true" />
      <div
        class={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        ref={trapRef}
      >
        <h3 class={styles.title} id="confirm-title">{title}</h3>
        <p class={styles.message} id="confirm-message">{message}</p>
        <div class={styles.actions}>
          <button class={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            class={`${styles.confirmBtn} ${variant === 'danger' ? styles.dangerBtn : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
