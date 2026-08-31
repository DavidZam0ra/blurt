import { Injectable, inject } from '@angular/core';
import { CaptureApiService } from '../api/capture-api.service';
import { ExtractedEvent } from '../models/extracted-event';
import { Note } from '../models/note';

@Injectable({ providedIn: 'root' })
export class UpdateEventInNoteUseCase {
  private readonly captureApi = inject(CaptureApiService);

  execute(noteId: string, index: number, event: ExtractedEvent): Promise<Note> {
    return this.captureApi.updateEvent(noteId, index, event);
  }
}
