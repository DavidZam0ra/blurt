import { Injectable, inject } from '@angular/core';
import { NoteRepository } from '../storage/note-repository';
import { CaptureApiService } from '../api/capture-api.service';
import { VoiceNoteStatus } from '../models/voice-note';

@Injectable({ providedIn: 'root' })
export class SyncPendingNotesUseCase {
  private readonly noteRepository = inject(NoteRepository);
  private readonly captureApi = inject(CaptureApiService);

  async execute(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    const notes = await this.noteRepository.list();
    const pendingNotes = notes.filter((note) => note.status === VoiceNoteStatus.Pending);

    for (const note of pendingNotes) {
      note.status = VoiceNoteStatus.Uploading;
      await this.noteRepository.save(note);

      try {
        note.candidateEvents = await this.captureApi.extractEvents(note.audio, note.createdAt);
        note.status = VoiceNoteStatus.AwaitingConfirmation;
      } catch (error) {
        note.status = VoiceNoteStatus.Error;
        note.errorMessage = error instanceof Error ? error.message : 'Failed to extract event';
      }

      await this.noteRepository.save(note);
    }
  }
}
