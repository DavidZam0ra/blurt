import { Injectable, inject } from '@angular/core';
import { CalendarApiService } from '../api/calendar-api.service';

@Injectable({ providedIn: 'root' })
export class SelectCalendarUseCase {
  private readonly calendarApi = inject(CalendarApiService);

  execute(googleCalendarId: string): Promise<{ googleCalendarId: string }> {
    return this.calendarApi.select(googleCalendarId);
  }
}
