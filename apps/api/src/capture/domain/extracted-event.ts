import { EventCategory } from './event-category';
import { EventRecurrence } from './event-recurrence';

export interface ExtractedEvent {
  title: string;
  startDateTime: string;
  reminderOffsetsInMinutes: number[];
  isAmbiguous: boolean;
  category: EventCategory;
  recurrence?: EventRecurrence;
  /** IANA zone (e.g. "Europe/Madrid") — Google Calendar needs this to resolve a recurrence's local time across DST. */
  timeZone?: string;
}
