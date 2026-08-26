import { Injectable, inject } from '@angular/core';
import { NoteRepository } from '../storage/note-repository';
import { CaptureApiService } from '../api/capture-api.service';
import { VoiceNote } from '../models/voice-note';

@Injectable({ providedIn: 'root' })
export class DeleteVoiceNoteUseCase {
  private readonly noteRepository = inject(NoteRepository);
  private readonly captureApi = inject(CaptureApiService);

  async execute(note: VoiceNote): Promise<void> {
    for (const externalEventId of note.externalEventIds ?? []) {
      await this.captureApi.undoEvent(externalEventId);
    }
    await this.noteRepository.delete(note.id);
  }
}
