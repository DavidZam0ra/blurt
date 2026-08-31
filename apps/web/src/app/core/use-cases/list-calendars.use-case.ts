import { Injectable, inject } from '@angular/core';
import { CalendarApiService } from '../api/calendar-api.service';
import { GoogleCalendarListEntry } from '../models/google-calendar';

@Injectable({ providedIn: 'root' })
export class ListCalendarsUseCase {
  private readonly calendarApi = inject(CalendarApiService);

  execute(): Promise<GoogleCalendarListEntry[]> {
    return this.calendarApi.list();
  }
}
