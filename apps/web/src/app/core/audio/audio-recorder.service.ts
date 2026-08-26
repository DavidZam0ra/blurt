import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private mediaRecorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private stream?: MediaStream;

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
          resolve(new Blob(this.chunks, { type: 'audio/webm' }));
        },
        { once: true },
      );
      mediaRecorder.stop();
    });
  }
}
