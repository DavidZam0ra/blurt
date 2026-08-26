import { Inject, Injectable } from '@nestjs/common';
import { CALENDAR_PORT } from '../domain/calendar.port';
import type { CalendarPort } from '../domain/calendar.port';

@Injectable()
export class UndoCalendarEventUseCase {
  constructor(@Inject(CALENDAR_PORT) private readonly calendarPort: CalendarPort) {}

  async execute(externalEventId: string): Promise<void> {
    return this.calendarPort.deleteEvent(externalEventId);
  }
}
