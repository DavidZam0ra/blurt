import { EventCategory } from './event-category';
import { EventRecurrence } from './event-recurrence';

export interface ExtractedEvent {
  title: string;
  startDateTime: string;
  durationInMinutes?: number;
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
