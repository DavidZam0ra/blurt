export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface EventRecurrence {
  frequency: RecurrenceFrequency;
  interval?: number;
  byDayOfWeek?: number[];
  count?: number;
  until?: string;
}

const RECURRENCE_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Cada día',
  weekly: 'Cada semana',
  monthly: 'Cada mes',
};

export function recurrenceLabel(recurrence: EventRecurrence | undefined): string | null {
  if (!recurrence) {
    return null;
  }

  const base =
    recurrence.interval && recurrence.interval > 1
      ? `Cada ${recurrence.interval} ${{ daily: 'días', weekly: 'semanas', monthly: 'meses' }[recurrence.frequency]}`
      : RECURRENCE_LABELS[recurrence.frequency];

  if (recurrence.count) {
    return `${base} · ${recurrence.count} veces`;
  }
  if (recurrence.until) {
    return `${base} · hasta ${formatShortDate(recurrence.until)}`;
  }
  return base;
}

function formatShortDate(isoDateTime: string): string {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(
    new Date(isoDateTime),
  );
}
