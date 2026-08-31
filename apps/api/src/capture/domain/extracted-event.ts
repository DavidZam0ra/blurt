import { EventCategory } from './event-category';
import { EventRecurrence } from './event-recurrence';

export interface ExtractedEvent {
  title: string;
  startDateTime: string;
  /** Only set when the speaker explicitly states a duration; otherwise callers fall back to a default. */
  durationInMinutes?: number;
  reminderOffsetsInMinutes: number[];
  isAmbiguous: boolean;
  category: EventCategory;
  recurrence?: EventRecurrence;
  /** IANA zone (e.g. "Europe/Madrid") — Google Calendar needs this to resolve a recurrence's local time across DST. */
  timeZone?: string;
}
