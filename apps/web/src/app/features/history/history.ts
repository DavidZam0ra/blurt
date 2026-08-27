import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ListNotesUseCase } from '../../core/use-cases/list-notes.use-case';
import { UndoVoiceNoteUseCase } from '../../core/use-cases/undo-voice-note.use-case';
import { DeleteVoiceNoteUseCase } from '../../core/use-cases/delete-voice-note.use-case';
import { ToastService } from '../../core/toast/toast.service';
import { Note, NoteStatus } from '../../core/models/note';
import { EVENT_CATEGORY_LABELS } from '../../core/models/event-category';
import { CategoryIcon } from '../../shared/category-icon/category-icon';

interface StatusMeta {
  label: string;
  cssClass: string;
}

const STATUS_META: Record<NoteStatus, StatusMeta> = {
  [NoteStatus.AwaitingConfirmation]: { label: 'Por confirmar', cssClass: 'tag tag-outline' },
  [NoteStatus.Synced]: { label: 'Sincronizado', cssClass: 'tag tag-accent' },
  [NoteStatus.Error]: { label: 'Error', cssClass: 'tag tag-neutral' },
};

@Component({
  selector: 'app-history',
  imports: [DatePipe, CategoryIcon],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private readonly listNotes = inject(ListNotesUseCase);
  private readonly undoVoiceNote = inject(UndoVoiceNoteUseCase);
  private readonly deleteVoiceNote = inject(DeleteVoiceNoteUseCase);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly notes = signal<Note[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly NoteStatus = NoteStatus;
  protected readonly categoryLabels = EVENT_CATEGORY_LABELS;

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    await this.reload();
    this.isLoading.set(false);
  }

  protected statusMeta(status: NoteStatus): StatusMeta {
    return STATUS_META[status];
  }

  private async reload(): Promise<void> {
    this.notes.set(await this.listNotes.execute());
  }

  protected async goHome(): Promise<void> {
    await this.router.navigate(['/']);
  }

  protected async review(note: Note): Promise<void> {
    await this.router.navigate(['/confirm', note.id]);
  }

  protected async undo(note: Note): Promise<void> {
    await this.undoVoiceNote.execute(note);
    this.toast.show('Deshecho');
    await this.reload();
  }

  protected delete(note: Note): void {
    this.notes.update((notes) => notes.filter((n) => n.id !== note.id));

    this.toast.showAction(
      'Nota eliminada',
      'Deshacer',
      () => void this.reload(),
      () => void this.commitDelete(note),
    );
  }

  private async commitDelete(note: Note): Promise<void> {
    try {
      await this.deleteVoiceNote.execute(note);
    } catch {
      this.toast.show('No se pudo eliminar la nota');
      await this.reload();
    }
  }
}
