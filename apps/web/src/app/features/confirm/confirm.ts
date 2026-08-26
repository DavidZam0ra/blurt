import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NoteRepository } from '../../core/storage/note-repository';
import { ConfirmVoiceNoteUseCase } from '../../core/use-cases/confirm-voice-note.use-case';
import { VoiceNote, VoiceNoteStatus } from '../../core/models/voice-note';
import { ExtractedEvent } from '../../core/models/extracted-event';

const AUTO_CONFIRM_DELAY_IN_SECONDS = 5;

@Component({
  selector: 'app-confirm',
  imports: [FormsModule],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss',
})
export class Confirm implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly noteRepository = inject(NoteRepository);
  private readonly confirmVoiceNote = inject(ConfirmVoiceNoteUseCase);

  private note?: VoiceNote;
  private autoConfirmIntervalId?: ReturnType<typeof setInterval>;

  protected readonly events = signal<ExtractedEvent[]>([]);
  protected readonly autoConfirmSecondsLeft = signal<number | null>(null);
  protected readonly isSaving = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    const note = id ? await this.noteRepository.findById(id) : undefined;

    if (!note || note.status !== VoiceNoteStatus.AwaitingConfirmation || !note.candidateEvents) {
      await this.router.navigate(['/history']);
      return;
    }

    this.note = note;
    this.events.set(note.candidateEvents.map((event) => ({ ...event })));
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

  private updateEvent(index: number, changes: Partial<ExtractedEvent>): void {
    this.events.update((events) =>
      events.map((event, i) => (i === index ? { ...event, ...changes } : event)),
    );
  }

  private startAutoConfirmIfUnambiguous(): void {
    if (this.events().some((event) => event.isAmbiguous)) {
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

  protected async confirm(): Promise<void> {
    if (!this.note || this.isSaving()) {
      return;
    }
    this.clearAutoConfirmTimer();
    this.isSaving.set(true);
    await this.confirmVoiceNote.execute(this.note, this.events());
    await this.router.navigate(['/history']);
  }
}
