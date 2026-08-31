import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CalendarPort,
  GoogleCalendarCredentials,
  GoogleCalendarListEntry,
} from '../domain/calendar.port';
import { ExtractedEvent } from '../domain/extracted-event';

@Injectable()
export class InMemoryCalendarAdapter implements CalendarPort {
  private readonly logger = new Logger(InMemoryCalendarAdapter.name);

  listCalendars(): Promise<GoogleCalendarListEntry[]> {
    return Promise.resolve([{ id: 'primary', summary: 'Personal', primary: true }]);
  }

  createEvent(
    event: ExtractedEvent,
    credentials: GoogleCalendarCredentials,
  ): Promise<string> {
    const externalEventId = randomUUID();
    this.logger.log(
      `[stub] createEvent(calendarId=${credentials.calendarId}, title="${event.title}", startDateTime=${event.startDateTime}) -> ${externalEventId}`,
    );
    return Promise.resolve(externalEventId);
  }

  updateEvent(
    externalEventId: string,
    event: ExtractedEvent,
    credentials: GoogleCalendarCredentials,
  ): Promise<void> {
    this.logger.log(
      `[stub] updateEvent(calendarId=${credentials.calendarId}, externalEventId=${externalEventId}, title="${event.title}")`,
    );
    return Promise.resolve();
  }

  deleteEvent(
    externalEventId: string,
    credentials: GoogleCalendarCredentials,
  ): Promise<void> {
    this.logger.log(
      `[stub] deleteEvent(calendarId=${credentials.calendarId}, externalEventId=${externalEventId})`,
    );
    return Promise.resolve();
  }

  eventExists(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
