import { Injectable, inject } from '@angular/core';
import { NoteRepository } from '../storage/note-repository';
import { CaptureApiService } from '../api/capture-api.service';
import { VoiceNote, VoiceNoteStatus } from '../models/voice-note';

@Injectable({ providedIn: 'root' })
export class UndoVoiceNoteUseCase {
  private readonly noteRepository = inject(NoteRepository);
  private readonly captureApi = inject(CaptureApiService);

  async execute(note: VoiceNote): Promise<void> {
    for (const externalEventId of note.externalEventIds ?? []) {
      await this.captureApi.undoEvent(externalEventId);
    }
    note.externalEventIds = undefined;
    note.status = VoiceNoteStatus.AwaitingConfirmation;
    await this.noteRepository.save(note);
  }
}
