import { Injectable, inject } from '@angular/core';
import { NoteRepository } from '../storage/note-repository';
import { VoiceNote, VoiceNoteStatus } from '../models/voice-note';

@Injectable({ providedIn: 'root' })
export class CaptureVoiceNoteUseCase {
  private readonly noteRepository = inject(NoteRepository);

  async execute(audio: Blob): Promise<VoiceNote> {
    const note: VoiceNote = {
      id: crypto.randomUUID(),
      audio,
      createdAt: Date.now(),
      status: VoiceNoteStatus.Pending,
    };
    await this.noteRepository.save(note);
    return note;
  }
}
