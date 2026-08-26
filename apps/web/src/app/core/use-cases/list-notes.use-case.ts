import { Injectable, inject } from '@angular/core';
import { CaptureApiService } from '../api/capture-api.service';
import { Note } from '../models/note';

@Injectable({ providedIn: 'root' })
export class ListNotesUseCase {
  private readonly captureApi = inject(CaptureApiService);

  execute(): Promise<Note[]> {
    return this.captureApi.listNotes();
  }
}
