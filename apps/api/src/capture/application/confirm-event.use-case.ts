import { Inject, Injectable } from '@nestjs/common';
import { ExtractedEvent } from '../domain/extracted-event';
import { CALENDAR_PORT } from '../domain/calendar.port';
import type { CalendarPort } from '../domain/calendar.port';

@Injectable()
export class ConfirmEventUseCase {
  constructor(@Inject(CALENDAR_PORT) private readonly calendarPort: CalendarPort) {}

  async execute(event: ExtractedEvent, calendarId: string): Promise<string> {
    return this.calendarPort.createEvent(event, calendarId);
  }
}
