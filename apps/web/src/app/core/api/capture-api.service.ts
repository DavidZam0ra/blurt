import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { ExtractedEvent } from '../models/extracted-event';
import { Note } from '../models/note';

@Injectable({ providedIn: 'root' })
export class CaptureApiService {
  private readonly http = inject(HttpClient);

  async extract(
    audio: Blob,
    referenceDateTime: number,
  ): Promise<{ noteId: string; events: ExtractedEvent[] }> {
    const formData = new FormData();
    formData.append('audio', audio, 'note.webm');
    formData.append('referenceDateTime', new Date(referenceDateTime).toISOString());
    formData.append('timeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    return firstValueFrom(
      this.http.post<{ noteId: string; events: ExtractedEvent[] }>(
        `${API_BASE_URL}/capture/extract`,
        formData,
      ),
    );
  }

  listNotes(): Promise<Note[]> {
    return firstValueFrom(this.http.get<Note[]>(`${API_BASE_URL}/notes`));
  }

  getNote(id: string): Promise<Note> {
    return firstValueFrom(this.http.get<Note>(`${API_BASE_URL}/notes/${id}`));
  }

  confirmNote(id: string, events: ExtractedEvent[]): Promise<Note> {
    return firstValueFrom(
      this.http.post<Note>(`${API_BASE_URL}/notes/${id}/confirm`, { events }),
    );
  }

  undoNote(id: string): Promise<Note> {
    return firstValueFrom(
      this.http.post<Note>(`${API_BASE_URL}/notes/${id}/undo`, {}),
    );
  }

  deleteNote(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_BASE_URL}/notes/${id}`));
  }
}
