import { ExtractedEvent } from './extracted-event';

export const CALENDAR_PORT = Symbol('CalendarPort');

export interface GoogleCalendarCredentials {
  refreshToken: string;
  calendarId: string;
}

export interface CalendarPort {
  createEvent(
    event: ExtractedEvent,
    credentials: GoogleCalendarCredentials,
  ): Promise<string>;
  deleteEvent(
    externalEventId: string,
    credentials: GoogleCalendarCredentials,
  ): Promise<void>;
}
