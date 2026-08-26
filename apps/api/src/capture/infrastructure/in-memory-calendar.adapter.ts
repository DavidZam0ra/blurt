import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CalendarPort } from '../domain/calendar.port';
import { ExtractedEvent } from '../domain/extracted-event';

/**
 * Phase 1 stub: logs calls and returns a fake id instead of talking to Google Calendar.
 * Replace with a real Google Calendar adapter once OAuth is wired up.
 */
@Injectable()
export class InMemoryCalendarAdapter implements CalendarPort {
  private readonly logger = new Logger(InMemoryCalendarAdapter.name);

  async createEvent(event: ExtractedEvent, calendarId: string): Promise<string> {
    const externalEventId = randomUUID();
    this.logger.log(
      `[stub] createEvent(calendarId=${calendarId}, title="${event.title}", startDateTime=${event.startDateTime}) -> ${externalEventId}`,
    );
    return externalEventId;
  }

  async deleteEvent(externalEventId: string): Promise<void> {
    this.logger.log(`[stub] deleteEvent(externalEventId=${externalEventId})`);
  }
}
