/**
 * Date formatting and due-date status utilities.
 */

export type DueDateStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'later';

export function getDueDateStatus(dueDate: Date | null | undefined): DueDateStatus | null {
  if (!dueDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays <= 7) return 'upcoming';
  return 'later';
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function toISODateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0]!;
}
