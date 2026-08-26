import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NoteRepository } from '../../core/storage/note-repository';
import { SyncPendingNotesUseCase } from '../../core/use-cases/sync-pending-notes.use-case';
import { UndoVoiceNoteUseCase } from '../../core/use-cases/undo-voice-note.use-case';
import { VoiceNote, VoiceNoteStatus } from '../../core/models/voice-note';

@Component({
  selector: 'app-history',
  imports: [DatePipe],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private readonly noteRepository = inject(NoteRepository);
  private readonly syncPendingNotes = inject(SyncPendingNotesUseCase);
  private readonly undoVoiceNote = inject(UndoVoiceNoteUseCase);
  private readonly router = inject(Router);

  protected readonly notes = signal<VoiceNote[]>([]);
  protected readonly VoiceNoteStatus = VoiceNoteStatus;

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.notes.set(await this.noteRepository.list());
  }

  protected async review(note: VoiceNote): Promise<void> {
    await this.router.navigate(['/confirm', note.id]);
  }

  protected async undo(note: VoiceNote): Promise<void> {
    await this.undoVoiceNote.execute(note);
    await this.reload();
  }

  protected async retry(note: VoiceNote): Promise<void> {
    note.status = VoiceNoteStatus.Pending;
    note.errorMessage = undefined;
    await this.noteRepository.save(note);
    await this.syncPendingNotes.execute();
    await this.reload();
  }
}
