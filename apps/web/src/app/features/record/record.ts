import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AudioRecorderService } from '../../core/audio/audio-recorder.service';
import { CaptureVoiceNoteUseCase } from '../../core/use-cases/capture-voice-note.use-case';
import { SyncPendingNotesUseCase } from '../../core/use-cases/sync-pending-notes.use-case';

@Component({
  selector: 'app-record',
  imports: [],
  templateUrl: './record.html',
  styleUrl: './record.scss',
})
export class Record {
  private readonly audioRecorder = inject(AudioRecorderService);
  private readonly captureVoiceNote = inject(CaptureVoiceNoteUseCase);
  private readonly syncPendingNotes = inject(SyncPendingNotesUseCase);
  private readonly router = inject(Router);

  protected readonly isRecording = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  async toggleRecording(): Promise<void> {
    if (this.isRecording()) {
      await this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.audioRecorder.start();
      this.isRecording.set(true);
    } catch {
      this.errorMessage.set('Microphone access is required to record a note.');
    }
  }

  private async stopRecording(): Promise<void> {
    this.isRecording.set(false);
    const audio = await this.audioRecorder.stop();
    await this.captureVoiceNote.execute(audio);
    void this.syncPendingNotes.execute();
    await this.router.navigate(['/history']);
  }
}
