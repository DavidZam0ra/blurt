import { ExtractedEvent } from './extracted-event';

export const CALENDAR_PORT = Symbol('CalendarPort');

export interface GoogleCalendarCredentials {
  refreshToken: string;
  calendarId: string;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface CalendarPort {
  listCalendars(
    credentials: GoogleCalendarCredentials,
  ): Promise<GoogleCalendarListEntry[]>;
  createEvent(
    event: ExtractedEvent,
    credentials: GoogleCalendarCredentials,
  ): Promise<string>;
  updateEvent(
    externalEventId: string,
    event: ExtractedEvent,
    credentials: GoogleCalendarCredentials,
  ): Promise<void>;
  deleteEvent(
    externalEventId: string,
    credentials: GoogleCalendarCredentials,
  ): Promise<void>;
  eventExists(
    externalEventId: string,
    credentials: GoogleCalendarCredentials,
  ): Promise<boolean>;
}
