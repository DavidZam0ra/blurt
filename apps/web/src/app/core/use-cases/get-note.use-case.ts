import { Injectable, inject } from '@angular/core';
import { CaptureApiService } from '../api/capture-api.service';
import { Note } from '../models/note';

@Injectable({ providedIn: 'root' })
export class GetNoteUseCase {
  private readonly captureApi = inject(CaptureApiService);

  execute(id: string): Promise<Note> {
    return this.captureApi.getNote(id);
  }
}
