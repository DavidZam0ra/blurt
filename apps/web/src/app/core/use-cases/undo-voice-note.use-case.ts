import { Injectable, inject } from '@angular/core';
import { CaptureApiService } from '../api/capture-api.service';
import { Note } from '../models/note';

@Injectable({ providedIn: 'root' })
export class UndoVoiceNoteUseCase {
  private readonly captureApi = inject(CaptureApiService);

  execute(note: Note): Promise<Note> {
    return this.captureApi.undoNote(note.id);
  }
}
