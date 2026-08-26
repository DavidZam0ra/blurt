import { Injectable, inject } from '@angular/core';
import { NoteRepository } from '../storage/note-repository';
import { CaptureApiService } from '../api/capture-api.service';
import { DEFAULT_CALENDAR_ID } from '../api-config';
import { VoiceNote, VoiceNoteStatus } from '../models/voice-note';
import { ExtractedEvent } from '../models/extracted-event';

@Injectable({ providedIn: 'root' })
export class ConfirmVoiceNoteUseCase {
  private readonly noteRepository = inject(NoteRepository);
  private readonly captureApi = inject(CaptureApiService);

  async execute(note: VoiceNote, events: ExtractedEvent[]): Promise<void> {
    note.candidateEvents = events;
    note.status = VoiceNoteStatus.Confirmed;
    await this.noteRepository.save(note);

    try {
      const externalEventIds: string[] = [];
      for (const event of events) {
        const { externalEventId } = await this.captureApi.confirmEvent(event, DEFAULT_CALENDAR_ID);
        externalEventIds.push(externalEventId);
      }
      note.externalEventIds = externalEventIds;
      note.status = VoiceNoteStatus.Synced;
    } catch (error) {
      note.status = VoiceNoteStatus.Error;
      note.errorMessage = error instanceof Error ? error.message : 'Failed to confirm event';
    }

    await this.noteRepository.save(note);
  }
}
