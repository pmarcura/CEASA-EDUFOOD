import type { Timestamp, FieldValue } from 'firebase/firestore';

// Type guard to check if the value is a Firestore Timestamp
function isTimestamp(value: any): value is Timestamp {
  return value && typeof value.toDate === 'function';
}

/**
 * Formats a Firestore Timestamp or a Date object into a relative time string (e.g., "5m atrás", "1h atrás").
 * @param dateValue The date value, which can be a Firestore Timestamp, an object with a toDate method, or null/undefined.
 * @returns A formatted relative time string or an empty string if the date is invalid.
 */
export const formatTimeAgo = (dateValue: Timestamp | { toDate: () => Date } | FieldValue | null | undefined): string => {
  if (!dateValue || !isTimestamp(dateValue)) {
    // Return an empty string or a placeholder for invalid or server-pending timestamps
    return 'agora mesmo';
  }

  try {
    const date = dateValue.toDate();
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'agora mesmo';
    if (seconds < 60) return `${seconds}s atrás`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m atrás`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (error) {
    console.error("Error formatting time:", error);
    return '';
  }
};