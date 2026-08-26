import { Injectable, inject } from '@angular/core';
import { CaptureApiService } from '../api/capture-api.service';
import { Note } from '../models/note';
import { ExtractedEvent } from '../models/extracted-event';

@Injectable({ providedIn: 'root' })
export class ConfirmVoiceNoteUseCase {
  private readonly captureApi = inject(CaptureApiService);

  execute(noteId: string, events: ExtractedEvent[]): Promise<Note> {
    return this.captureApi.confirmNote(noteId, events);
  }
}
