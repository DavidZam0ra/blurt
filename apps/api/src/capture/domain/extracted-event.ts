import { EventCategory } from './event-category';

export interface ExtractedEvent {
  title: string;
  startDateTime: string;
  reminderOffsetsInMinutes: number[];
  isAmbiguous: boolean;
  category: EventCategory;
}
