import { EventCategory } from './event-category';
import { EventRecurrence } from './event-recurrence';

export interface ExtractedEvent {
  title: string;
  startDateTime: string;
  reminderOffsetsInMinutes: number[];
  isAmbiguous: boolean;
  category: EventCategory;
  recurrence?: EventRecurrence;
  timeZone?: string;
}
