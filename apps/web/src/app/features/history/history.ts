import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ListNotesUseCase } from '../../core/use-cases/list-notes.use-case';
import { UndoVoiceNoteUseCase } from '../../core/use-cases/undo-voice-note.use-case';
import { DeleteVoiceNoteUseCase } from '../../core/use-cases/delete-voice-note.use-case';
import { RemoveEventFromNoteUseCase } from '../../core/use-cases/remove-event-from-note.use-case';
import { UpdateEventInNoteUseCase } from '../../core/use-cases/update-event-in-note.use-case';
import { ToastService } from '../../core/toast/toast.service';
import { Note, NoteStatus } from '../../core/models/note';
import { ExtractedEvent } from '../../core/models/extracted-event';
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from '../../core/models/event-category';
import { RecurrenceFrequency, recurrenceLabel } from '../../core/models/event-recurrence';
import { toDateTimeLocalInputValue } from '../../core/models/date-time-local';
import { CategoryIcon } from '../../shared/category-icon/category-icon';

interface StatusMeta {
  label: string;
  cssClass: string;
}

interface EventCard {
  note: Note;
  event: Note['candidateEvents'][number];
  index: number;
}

type HistoryTab = 'upcoming' | 'past' | 'all';

const STATUS_META: Record<NoteStatus, StatusMeta> = {
  [NoteStatus.AwaitingConfirmation]: { label: 'Por confirmar', cssClass: 'tag tag-outline' },
  [NoteStatus.Synced]: { label: 'Sincronizado', cssClass: 'tag tag-accent' },
  [NoteStatus.Error]: { label: 'Error', cssClass: 'tag tag-neutral' },
};

function isUpcoming(card: EventCard, now: number): boolean {
  return eventTime(card) >= now;
}

function eventTime(card: EventCard): number {
  return new Date(card.event.startDateTime).getTime();
}

@Component({
  selector: 'app-history',
  imports: [DatePipe, CategoryIcon, FormsModule],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {
  private readonly listNotes = inject(ListNotesUseCase);
  private readonly undoVoiceNote = inject(UndoVoiceNoteUseCase);
  private readonly deleteVoiceNote = inject(DeleteVoiceNoteUseCase);
  private readonly removeEventFromNote = inject(RemoveEventFromNoteUseCase);
  private readonly updateEventInNote = inject(UpdateEventInNoteUseCase);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly notes = signal<Note[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly NoteStatus = NoteStatus;
  protected readonly categories = EVENT_CATEGORIES;
  protected readonly categoryLabels = EVENT_CATEGORY_LABELS;
  protected readonly recurrenceLabel = recurrenceLabel;
  protected readonly toDateTimeLocal = toDateTimeLocalInputValue;

  protected readonly editingCardKey = signal<string | null>(null);
  protected readonly editBuffer = signal<ExtractedEvent | null>(null);
  protected readonly isEditSaving = signal(false);

  protected readonly eventCards = computed<EventCard[]>(() =>
    this.notes().flatMap((note) =>
      note.candidateEvents.map((event, index) => ({ note, event, index })),
    ),
  );

  protected readonly activeTab = signal<HistoryTab>('upcoming');

  protected readonly tabCounts = computed(() => {
    const now = Date.now();
    const cards = this.eventCards();
    const upcoming = cards.filter((card) => isUpcoming(card, now)).length;
    return { upcoming, past: cards.length - upcoming, all: cards.length };
  });

  protected readonly filteredEventCards = computed(() => {
    const tab = this.activeTab();
    const now = Date.now();
    const filtered =
      tab === 'all'
        ? this.eventCards()
        : this.eventCards().filter((card) => isUpcoming(card, now) === (tab === 'upcoming'));

    return [...filtered].sort((a, b) => {
      const diff = eventTime(a) - eventTime(b);
      return tab === 'past' ? -diff : diff;
    });
  });

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

  protected isEventSynced(note: Note, index: number): boolean {
    return index < note.externalEventIds.length;
  }

  protected async removeEvent(note: Note, index: number): Promise<void> {
    try {
      await this.removeEventFromNote.execute(note.id, index);
      this.toast.show(this.isEventSynced(note, index) ? 'Deshecho' : 'Evento quitado');
      await this.reload();
    } catch {
      this.toast.show('No se pudo quitar el evento');
    }
  }

  private cardKey(card: EventCard): string {
    return `${card.note.id}:${card.index}`;
  }

  protected isEditing(card: EventCard): boolean {
    return this.editingCardKey() === this.cardKey(card);
  }

  protected startEdit(card: EventCard): void {
    this.editingCardKey.set(this.cardKey(card));
    this.editBuffer.set({ ...card.event });
  }

  protected cancelEdit(): void {
    this.editingCardKey.set(null);
    this.editBuffer.set(null);
  }

  protected onEditTitleChange(title: string): void {
    this.updateEditBuffer({ title });
  }

  protected onEditStartDateTimeChange(dateTimeLocalValue: string): void {
    this.updateEditBuffer({ startDateTime: new Date(dateTimeLocalValue).toISOString() });
  }

  protected onEditCategoryChange(category: ExtractedEvent['category']): void {
    this.updateEditBuffer({ category });
  }

  protected onEditRecurrenceChange(frequency: RecurrenceFrequency | 'none'): void {
    this.updateEditBuffer({
      recurrence: frequency === 'none' ? undefined : { frequency, interval: 1 },
    });
  }

  private updateEditBuffer(changes: Partial<ExtractedEvent>): void {
    this.editBuffer.update((event) => (event ? { ...event, ...changes } : event));
  }

  protected async saveEdit(card: EventCard): Promise<void> {
    const editedEvent = this.editBuffer();
    if (!editedEvent || this.isEditSaving()) {
      return;
    }
    this.isEditSaving.set(true);
    try {
      await this.updateEventInNote.execute(card.note.id, card.index, editedEvent);
      this.toast.show('Guardado');
      this.cancelEdit();
      await this.reload();
    } catch {
      this.toast.show('No se pudo guardar el cambio');
    } finally {
      this.isEditSaving.set(false);
    }
  }
}
