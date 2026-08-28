import { Injectable, inject } from '@angular/core';
import { CaptureApiService } from '../api/capture-api.service';
import { Note } from '../models/note';

@Injectable({ providedIn: 'root' })
export class RemoveEventFromNoteUseCase {
  private readonly captureApi = inject(CaptureApiService);

  execute(noteId: string, index: number): Promise<Note | null> {
    return this.captureApi.removeEvent(noteId, index);
  }
}
