import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { ExtractedEvent } from '../models/extracted-event';

@Injectable({ providedIn: 'root' })
export class CaptureApiService {
  private readonly http = inject(HttpClient);

  async extractEvents(audio: Blob, referenceDateTime: number): Promise<ExtractedEvent[]> {
    const formData = new FormData();
    formData.append('audio', audio, 'note.webm');
    formData.append('referenceDateTime', new Date(referenceDateTime).toISOString());
    formData.append('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    return firstValueFrom(
      this.http.post<ExtractedEvent[]>(`${API_BASE_URL}/capture/extract`, formData),
    );
  }

  async confirmEvent(event: ExtractedEvent, calendarId: string): Promise<{ externalEventId: string }> {
    return firstValueFrom(
      this.http.post<{ externalEventId: string }>(`${API_BASE_URL}/capture/confirm`, { event, calendarId }),
    );
  }

  async undoEvent(externalEventId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${API_BASE_URL}/capture/events/${externalEventId}`));
  }
}
