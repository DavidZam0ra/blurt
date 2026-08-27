import { Injectable } from '@angular/core';

const LEVEL_SENSITIVITY = 15;
const LEVEL_SMOOTHING = 0.45;
const MIN_LEVEL = 0.12;
const WOBBLE_AMOUNT = 0.16;
const WOBBLE_PERIOD_IN_MS = 180;
const WOBBLE_PHASE_STEP = 1.7;

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private mediaRecorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private stream?: MediaStream;
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private timeDomainData?: Uint8Array<ArrayBuffer>;
  private smoothedLevel = MIN_LEVEL;

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    });
    this.mediaRecorder.start();

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.timeDomainData = new Uint8Array(this.analyser.fftSize);
    this.smoothedLevel = MIN_LEVEL;
    source.connect(this.analyser);
  }

  /**
   * Returns `barCount` normalized levels (0..1) sampled from the live mic
   * volume (RMS of the raw waveform, not the frequency spectrum — voice
   * energy sits almost entirely in the low bands, so a frequency-bucketed
   * split leaves the "high" bars nearly dead). Every bar is centered on the
   * same volume-driven level — no bar is structurally taller or shorter —
   * with a small per-bar time offset so they ripple instead of moving as a
   * single flat block.
   */
  sampleLevels(barCount: number): number[] {
    if (!this.analyser || !this.timeDomainData) {
      return new Array(barCount).fill(MIN_LEVEL);
    }

    this.analyser.getByteTimeDomainData(this.timeDomainData);
    let sumSquares = 0;
    for (const sample of this.timeDomainData) {
      const normalized = (sample - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / this.timeDomainData.length);
    const rawLevel = Math.min(1, rms * LEVEL_SENSITIVITY);
    this.smoothedLevel = this.smoothedLevel * (1 - LEVEL_SMOOTHING) + rawLevel * LEVEL_SMOOTHING;

    const now = performance.now();
    return Array.from({ length: barCount }, (_, i) => {
      const wobble = 1 + WOBBLE_AMOUNT * Math.sin(now / WOBBLE_PERIOD_IN_MS + i * WOBBLE_PHASE_STEP);
      return Math.max(MIN_LEVEL, Math.min(1, this.smoothedLevel * wobble));
    });
  }

  async stop(): Promise<Blob> {
    const mediaRecorder = this.mediaRecorder;
    if (!mediaRecorder) {
      throw new Error('Recording was not started');
    }

    return new Promise<Blob>((resolve) => {
      mediaRecorder.addEventListener(
        'stop',
        () => {
          this.stream?.getTracks().forEach((track) => track.stop());
          this.teardownAnalyser();
          resolve(new Blob(this.chunks, { type: 'audio/webm' }));
        },
        { once: true },
      );
      mediaRecorder.stop();
    });
  }

  cancel(): void {
    this.mediaRecorder?.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.teardownAnalyser();
  }

  private teardownAnalyser(): void {
    void this.audioContext?.close();
    this.audioContext = undefined;
    this.analyser = undefined;
    this.timeDomainData = undefined;
  }
}
