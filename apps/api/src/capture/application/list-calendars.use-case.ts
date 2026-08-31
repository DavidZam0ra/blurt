import { Inject, Injectable } from '@nestjs/common';
import {
  CALENDAR_PORT,
  GoogleCalendarListEntry,
} from '../domain/calendar.port';
import type { CalendarPort } from '../domain/calendar.port';
import { User } from '../../users/domain/user';
import { GoogleCredentialsResolver } from './google-credentials.resolver';

@Injectable()
export class ListCalendarsUseCase {
  constructor(
    @Inject(CALENDAR_PORT) private readonly calendarPort: CalendarPort,
    private readonly credentialsResolver: GoogleCredentialsResolver,
  ) {}

  execute(user: User): Promise<GoogleCalendarListEntry[]> {
    return this.calendarPort.listCalendars(this.credentialsResolver.resolve(user));
  }
}
