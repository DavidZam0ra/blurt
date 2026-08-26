import { ExtractedEvent } from './extracted-event';

export const CALENDAR_PORT = Symbol('CalendarPort');

export interface CalendarPort {
  createEvent(event: ExtractedEvent, calendarId: string): Promise<string>;
  deleteEvent(externalEventId: string): Promise<void>;
}
