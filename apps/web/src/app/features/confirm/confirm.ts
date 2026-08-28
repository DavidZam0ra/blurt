import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GetNoteUseCase } from '../../core/use-cases/get-note.use-case';
import { ConfirmVoiceNoteUseCase } from '../../core/use-cases/confirm-voice-note.use-case';
import { DeleteVoiceNoteUseCase } from '../../core/use-cases/delete-voice-note.use-case';
import { ToastService } from '../../core/toast/toast.service';
import { Note, NoteStatus } from '../../core/models/note';
import { ExtractedEvent } from '../../core/models/extracted-event';
import { EVENT_CATEGORY_LABELS } from '../../core/models/event-category';
import { RecurrenceFrequency, recurrenceLabel } from '../../core/models/event-recurrence';
import { CategoryIcon } from '../../shared/category-icon/category-icon';

const AUTO_CONFIRM_DELAY_IN_SECONDS = 5;
const RING_CIRCUMFERENCE = 56.5;
const NEW_EVENT_START_OFFSET_IN_MS = 60 * 60 * 1000;

function createBlankEvent(): ExtractedEvent {
  return {
    title: '',
    startDateTime: new Date(Date.now() + NEW_EVENT_START_OFFSET_IN_MS).toISOString(),
    reminderOffsetsInMinutes: [],
    isAmbiguous: false,
    category: 'uncategorized',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

@Component({
  selector: 'app-confirm',
  imports: [FormsModule, CategoryIcon],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss',
})
export class Confirm implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getNote = inject(GetNoteUseCase);
  private readonly confirmVoiceNote = inject(ConfirmVoiceNoteUseCase);
  private readonly deleteVoiceNote = inject(DeleteVoiceNoteUseCase);
  private readonly toast = inject(ToastService);

  private note?: Note;
  private autoConfirmIntervalId?: ReturnType<typeof setInterval>;

  protected readonly events = signal<ExtractedEvent[]>([]);
  protected readonly errorMessage = signal<string | undefined>(undefined);
  protected readonly autoConfirmSecondsLeft = signal<number | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly categoryLabels = EVENT_CATEGORY_LABELS;
  protected readonly recurrenceLabel = recurrenceLabel;

  protected readonly ringDashoffset = computed(() => {
    const secondsLeft = this.autoConfirmSecondsLeft();
    return secondsLeft === null ? 0 : RING_CIRCUMFERENCE * (1 - secondsLeft / AUTO_CONFIRM_DELAY_IN_SECONDS);
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/history']);
      return;
    }

    let note: Note | undefined;
    try {
      note = await this.getNote.execute(id);
    } catch {
      note = undefined;
    }

    if (
      !note ||
      (note.status !== NoteStatus.AwaitingConfirmation && note.status !== NoteStatus.Error)
    ) {
      await this.router.navigate(['/history']);
      return;
    }

    this.note = note;
    this.events.set(note.candidateEvents.map((event) => ({ ...event })));
    this.errorMessage.set(note.errorMessage);
    this.startAutoConfirmIfUnambiguous();
  }

  ngOnDestroy(): void {
    this.clearAutoConfirmTimer();
  }

  protected toDateTimeLocal(isoDateTime: string): string {
    const date = new Date(isoDateTime);
    const offsetInMinutes = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offsetInMinutes * 60000);
    return local.toISOString().slice(0, 16);
  }

  protected onTitleChange(index: number, title: string): void {
    this.cancelAutoConfirm();
    this.updateEvent(index, { title });
  }

  protected onStartDateTimeChange(index: number, dateTimeLocalValue: string): void {
    this.cancelAutoConfirm();
    this.updateEvent(index, { startDateTime: new Date(dateTimeLocalValue).toISOString() });
  }

  protected onRecurrenceChange(index: number, frequency: RecurrenceFrequency | 'none'): void {
    this.cancelAutoConfirm();
    this.updateEvent(index, {
      recurrence: frequency === 'none' ? undefined : { frequency, interval: 1 },
    });
  }

  protected addEvent(): void {
    this.cancelAutoConfirm();
    this.events.update((events) => [...events, createBlankEvent()]);
  }

  protected removeEvent(index: number): void {
    if (this.events().length <= 1) {
      return;
    }
    this.cancelAutoConfirm();
    this.events.update((events) => events.filter((_, i) => i !== index));
  }

  private updateEvent(index: number, changes: Partial<ExtractedEvent>): void {
    this.events.update((events) =>
      events.map((event, i) => (i === index ? { ...event, ...changes } : event)),
    );
  }

  private startAutoConfirmIfUnambiguous(): void {
    if (
      this.events().length === 0 ||
      this.events().some((event) => event.isAmbiguous || event.recurrence)
    ) {
      return;
    }

    this.autoConfirmSecondsLeft.set(AUTO_CONFIRM_DELAY_IN_SECONDS);
    this.autoConfirmIntervalId = setInterval(() => {
      const secondsLeft = (this.autoConfirmSecondsLeft() ?? 1) - 1;
      this.autoConfirmSecondsLeft.set(secondsLeft);
      if (secondsLeft <= 0) {
        this.clearAutoConfirmTimer();
        void this.confirm();
      }
    }, 1000);
  }

  protected cancelAutoConfirm(): void {
    this.clearAutoConfirmTimer();
    this.autoConfirmSecondsLeft.set(null);
  }

  private clearAutoConfirmTimer(): void {
    if (this.autoConfirmIntervalId !== undefined) {
      clearInterval(this.autoConfirmIntervalId);
      this.autoConfirmIntervalId = undefined;
    }
  }

  protected async goBack(): Promise<void> {
    await this.router.navigate(['/history']);
  }

  protected async cancel(): Promise<void> {
    if (!this.note || this.isSaving()) {
      return;
    }
    this.clearAutoConfirmTimer();
    this.isSaving.set(true);
    await this.deleteVoiceNote.execute(this.note);
    this.isSaving.set(false);
    await this.router.navigate(['/']);
  }

  protected async confirm(): Promise<void> {
    if (!this.note || this.isSaving()) {
      return;
    }
    this.clearAutoConfirmTimer();
    this.isSaving.set(true);
    const note = await this.confirmVoiceNote.execute(this.note.id, this.events());
    this.isSaving.set(false);

    if (note.status === NoteStatus.Synced) {
      this.toast.show('Guardado en Google Calendar');
      await this.router.navigate(['/history']);
    } else {
      this.toast.show(note.errorMessage ?? 'No se pudo guardar en Google Calendar');
    }
  }
}
