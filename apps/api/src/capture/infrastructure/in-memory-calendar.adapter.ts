import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CalendarPort,
  GoogleCalendarCredentials,
} from '../domain/calendar.port';
import { ExtractedEvent } from '../domain/extracted-event';

@Injectable()
export class InMemoryCalendarAdapter implements CalendarPort {
  private readonly logger = new Logger(InMemoryCalendarAdapter.name);

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

  deleteEvent(
    externalEventId: string,
    credentials: GoogleCalendarCredentials,
  ): Promise<void> {
    this.logger.log(
      `[stub] deleteEvent(calendarId=${credentials.calendarId}, externalEventId=${externalEventId})`,
    );
    return Promise.resolve();
  }
}
