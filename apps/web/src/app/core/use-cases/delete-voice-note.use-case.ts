import { Injectable, inject } from '@angular/core';
import { CaptureApiService } from '../api/capture-api.service';
import { Note } from '../models/note';

@Injectable({ providedIn: 'root' })
export class DeleteVoiceNoteUseCase {
  private readonly captureApi = inject(CaptureApiService);

  execute(note: Note): Promise<void> {
    return this.captureApi.deleteNote(note.id);
  }
}
