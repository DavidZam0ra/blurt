import { Injectable, inject } from '@angular/core';
import { CaptureApiService } from '../api/capture-api.service';
import { ExtractedEvent } from '../models/extracted-event';

@Injectable({ providedIn: 'root' })
export class CaptureVoiceNoteUseCase {
  private readonly captureApi = inject(CaptureApiService);

  execute(audio: Blob): Promise<{ noteId: string; events: ExtractedEvent[] }> {
    return this.captureApi.extract(audio, Date.now());
  }
}
