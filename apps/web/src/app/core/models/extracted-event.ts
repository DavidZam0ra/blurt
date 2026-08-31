import { EventCategory } from './event-category';
import { EventRecurrence } from './event-recurrence';

export interface ExtractedEvent {
  title: string;
  startDateTime: string;
  durationInMinutes?: number;
  endDate?: string;
  reminderOffsetsInMinutes: number[];
  isAmbiguous: boolean;
  category: EventCategory;
  recurrence?: EventRecurrence;
  timeZone?: string;
}

export function durationEndLabel(
  event: Pick<ExtractedEvent, 'startDateTime' | 'durationInMinutes'>,
): string | null {
  if (!event.durationInMinutes) {
    return null;
  }
  const end = new Date(
    new Date(event.startDateTime).getTime() + event.durationInMinutes * 60000,
  );
  const time = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(end);
  return `Hasta las ${time}`;
}

export function allDayRangeLabel(
  event: Pick<ExtractedEvent, 'endDate'>,
): string | null {
  if (!event.endDate) {
    return null;
  }
  const end = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(
    new Date(`${event.endDate}T00:00:00`),
  );
  return `Todo el día · hasta el ${end}`;
}
