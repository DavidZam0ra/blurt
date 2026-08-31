import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { GoogleCalendarListEntry } from '../models/google-calendar';

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly http = inject(HttpClient);

  list(): Promise<GoogleCalendarListEntry[]> {
    return firstValueFrom(
      this.http.get<GoogleCalendarListEntry[]>(`${API_BASE_URL}/calendars`),
    );
  }

  select(googleCalendarId: string): Promise<{ googleCalendarId: string }> {
    return firstValueFrom(
      this.http.patch<{ googleCalendarId: string }>(`${API_BASE_URL}/calendars/selection`, {
        googleCalendarId,
      }),
    );
  }
}
