import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AudioRecorderService } from '../../core/audio/audio-recorder.service';
import { CaptureVoiceNoteUseCase } from '../../core/use-cases/capture-voice-note.use-case';
import { OnlineStatusService } from '../../core/network/online-status.service';

const WAVE_BAR_COUNT = 6;
const EXAMPLE_DISPLAY_MS = 6000;
const EXAMPLE_EXIT_MS = 320;
const RECORD_EXAMPLES = [
  'Comida con Ana el jueves a las 2',
  'Cena a las 21:00 durante 2 horas',
  'Viaje a Andorra del 24 al 27',
  'Yoga todos los martes a las 7',
  'Dentista a las 10 y gimnasio a las 6',
];

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
export class Record implements OnDestroy {
  private readonly audioRecorder = inject(AudioRecorderService);
  private readonly captureVoiceNote = inject(CaptureVoiceNoteUseCase);
  private readonly router = inject(Router);
  protected readonly onlineStatus = inject(OnlineStatusService);

  protected readonly isRecording = signal(false);
  protected readonly isProcessing = signal(false);
  protected readonly elapsedSeconds = signal(0);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly waveLevels = signal<number[]>(new Array(WAVE_BAR_COUNT).fill(0.15));
  protected readonly exampleIndex = signal(0);
  protected readonly isExampleLeaving = signal(false);

  private elapsedIntervalId?: ReturnType<typeof setInterval>;
  private waveIntervalId?: ReturnType<typeof setInterval>;
  private exampleExitTimeoutId?: ReturnType<typeof setTimeout>;
  private readonly exampleIntervalId = setInterval(() => {
    // Road Runner-style exit: dash the current example off to the left,
    // then swap the text and let the next one skid in from the right.
    this.isExampleLeaving.set(true);
    this.exampleExitTimeoutId = setTimeout(() => {
      this.exampleIndex.update((i) => (i + 1) % RECORD_EXAMPLES.length);
      this.isExampleLeaving.set(false);
    }, EXAMPLE_EXIT_MS);
  }, EXAMPLE_DISPLAY_MS);

  protected readonly formattedElapsed = () => formatElapsed(this.elapsedSeconds());
  protected readonly currentExample = () => RECORD_EXAMPLES[this.exampleIndex()];

  ngOnDestroy(): void {
    clearInterval(this.elapsedIntervalId);
    clearInterval(this.waveIntervalId);
    clearInterval(this.exampleIntervalId);
    clearTimeout(this.exampleExitTimeoutId);
  }

  async startRecording(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.audioRecorder.start();
      this.isRecording.set(true);
      this.elapsedSeconds.set(0);
      this.elapsedIntervalId = setInterval(() => this.elapsedSeconds.update((s) => s + 1), 1000);
      this.waveIntervalId = setInterval(() => {
        this.waveLevels.set(this.audioRecorder.sampleLevels(WAVE_BAR_COUNT));
      }, 80);
    } catch {
      this.errorMessage.set('Se necesita acceso al micrófono para grabar una nota.');
    }
  }

  cancelRecording(): void {
    clearInterval(this.elapsedIntervalId);
    clearInterval(this.waveIntervalId);
    this.audioRecorder.cancel();
    this.isRecording.set(false);
  }

  async stopRecording(): Promise<void> {
    clearInterval(this.elapsedIntervalId);
    clearInterval(this.waveIntervalId);
    this.isRecording.set(false);
    const audio = await this.audioRecorder.stop();

    this.isProcessing.set(true);
    try {
      const { noteId } = await this.captureVoiceNote.execute(audio);
      await this.router.navigate(['/confirm', noteId]);
    } catch {
      this.errorMessage.set(
        'No se pudo procesar la nota. Comprueba tu conexión e inténtalo de nuevo.',
      );
    } finally {
      this.isProcessing.set(false);
    }
  }

  async goToHistory(): Promise<void> {
    await this.router.navigate(['/history']);
  }
}
