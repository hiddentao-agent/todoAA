import { useComputed } from '@preact/signals';
import { announcerMessage } from '@/stores/uiStore.ts';

/**
 * Visually-hidden polite live region for screen reader announcements.
 * The `announcerMessage` signal drives the content.
 */
export function Announcer() {
  const message = useComputed(() => announcerMessage.value);

  return (
    <div
      class="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message.value}
    </div>
  );
}
