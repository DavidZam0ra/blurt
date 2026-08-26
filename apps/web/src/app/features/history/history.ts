import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NoteRepository } from '../../core/storage/note-repository';
import { SyncPendingNotesUseCase } from '../../core/use-cases/sync-pending-notes.use-case';
import { UndoVoiceNoteUseCase } from '../../core/use-cases/undo-voice-note.use-case';
import { ToastService } from '../../core/toast/toast.service';
import { VoiceNote, VoiceNoteStatus } from '../../core/models/voice-note';
import { EVENT_CATEGORY_LABELS } from '../../core/models/event-category';
import { CategoryIcon } from '../../shared/category-icon/category-icon';

interface StatusMeta {
  label: string;
  cssClass: string;
}

const STATUS_META: Record<VoiceNoteStatus, StatusMeta> = {
  [VoiceNoteStatus.Pending]: { label: 'Pendiente', cssClass: 'tag tag-neutral' },
  [VoiceNoteStatus.Uploading]: { label: 'Sincronizando…', cssClass: 'tag tag-neutral' },
  [VoiceNoteStatus.AwaitingConfirmation]: { label: 'Por confirmar', cssClass: 'tag tag-outline' },
  [VoiceNoteStatus.Confirmed]: { label: 'Confirmando…', cssClass: 'tag tag-neutral' },
  [VoiceNoteStatus.Synced]: { label: 'Sincronizado', cssClass: 'tag tag-accent' },
  [VoiceNoteStatus.Error]: { label: 'Error', cssClass: 'tag tag-neutral' },
};

@Component({
  selector: 'app-history',
  imports: [DatePipe, CategoryIcon],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private readonly noteRepository = inject(NoteRepository);
  private readonly syncPendingNotes = inject(SyncPendingNotesUseCase);
  private readonly undoVoiceNote = inject(UndoVoiceNoteUseCase);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly notes = signal<VoiceNote[]>([]);
  protected readonly VoiceNoteStatus = VoiceNoteStatus;
  protected readonly categoryLabels = EVENT_CATEGORY_LABELS;

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  protected statusMeta(status: VoiceNoteStatus): StatusMeta {
    return STATUS_META[status];
  }

  private async reload(): Promise<void> {
    this.notes.set(await this.noteRepository.list());
  }

  protected async goHome(): Promise<void> {
    await this.router.navigate(['/']);
  }

  protected async review(note: VoiceNote): Promise<void> {
    await this.router.navigate(['/confirm', note.id]);
  }

  protected async undo(note: VoiceNote): Promise<void> {
    await this.undoVoiceNote.execute(note);
    this.toast.show('Deshecho');
    await this.reload();
  }

  protected async retry(note: VoiceNote): Promise<void> {
    note.status = VoiceNoteStatus.Pending;
    note.errorMessage = undefined;
    await this.noteRepository.save(note);
    await this.syncPendingNotes.execute();

    const retried = await this.noteRepository.findById(note.id);
    if (retried?.status === VoiceNoteStatus.AwaitingConfirmation) {
      this.toast.show('Listo para confirmar');
    } else if (retried?.status === VoiceNoteStatus.Error) {
      this.toast.show('Sigue fallando');
    }
    await this.reload();
  }
}
