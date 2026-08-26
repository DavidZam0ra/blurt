import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AudioRecorderService } from '../../core/audio/audio-recorder.service';
import { CaptureVoiceNoteUseCase } from '../../core/use-cases/capture-voice-note.use-case';
import { SyncPendingNotesUseCase } from '../../core/use-cases/sync-pending-notes.use-case';
import { NoteRepository } from '../../core/storage/note-repository';
import { OnlineStatusService } from '../../core/network/online-status.service';
import { VoiceNoteStatus } from '../../core/models/voice-note';

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

@Component({
  selector: 'app-record',
  imports: [],
  templateUrl: './record.html',
  styleUrl: './record.scss',
})
export class Record implements OnInit, OnDestroy {
  private readonly audioRecorder = inject(AudioRecorderService);
  private readonly captureVoiceNote = inject(CaptureVoiceNoteUseCase);
  private readonly syncPendingNotes = inject(SyncPendingNotesUseCase);
  private readonly noteRepository = inject(NoteRepository);
  private readonly router = inject(Router);
  protected readonly onlineStatus = inject(OnlineStatusService);

  protected readonly isRecording = signal(false);
  protected readonly elapsedSeconds = signal(0);
  protected readonly hasPending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private elapsedIntervalId?: ReturnType<typeof setInterval>;

  protected readonly formattedElapsed = () => formatElapsed(this.elapsedSeconds());

  async ngOnInit(): Promise<void> {
    const notes = await this.noteRepository.list();
    this.hasPending.set(
      notes.some((note) => note.status === VoiceNoteStatus.Pending || note.status === VoiceNoteStatus.Error),
    );
  }

  ngOnDestroy(): void {
    clearInterval(this.elapsedIntervalId);
  }

  async startRecording(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.audioRecorder.start();
      this.isRecording.set(true);
      this.elapsedSeconds.set(0);
      this.elapsedIntervalId = setInterval(() => this.elapsedSeconds.update((s) => s + 1), 1000);
    } catch {
      this.errorMessage.set('Se necesita acceso al micrófono para grabar una nota.');
    }
  }

  cancelRecording(): void {
    clearInterval(this.elapsedIntervalId);
    this.audioRecorder.cancel();
    this.isRecording.set(false);
  }

  async stopRecording(): Promise<void> {
    clearInterval(this.elapsedIntervalId);
    this.isRecording.set(false);
    const audio = await this.audioRecorder.stop();
    await this.captureVoiceNote.execute(audio);
    void this.syncPendingNotes.execute();
    await this.router.navigate(['/history']);
  }

  async goToHistory(): Promise<void> {
    await this.router.navigate(['/history']);
  }
}
