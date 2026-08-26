import { Inject, Injectable } from '@nestjs/common';
import { ExtractedEvent } from '../domain/extracted-event';
import { TRANSCRIPTION_PORT } from '../domain/transcription.port';
import type { TranscriptionPort } from '../domain/transcription.port';
import { EVENT_EXTRACTION_PORT } from '../domain/event-extraction.port';
import type { EventExtractionPort } from '../domain/event-extraction.port';

@Injectable()
export class ExtractEventFromAudioUseCase {
  constructor(
    @Inject(TRANSCRIPTION_PORT) private readonly transcriptionPort: TranscriptionPort,
    @Inject(EVENT_EXTRACTION_PORT) private readonly eventExtractionPort: EventExtractionPort,
  ) {}

  async execute(audio: Buffer, fileName: string, referenceDateTime: Date): Promise<ExtractedEvent[]> {
    const transcript = await this.transcriptionPort.transcribe(audio, fileName);
    return this.eventExtractionPort.extract(transcript, referenceDateTime);
  }
}
