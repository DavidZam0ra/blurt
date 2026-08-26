import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CaptureController } from './infrastructure/capture.controller';
import { ExtractEventFromAudioUseCase } from './application/extract-event-from-audio.use-case';
import { ConfirmEventUseCase } from './application/confirm-event.use-case';
import { UndoCalendarEventUseCase } from './application/undo-calendar-event.use-case';
import { TRANSCRIPTION_PORT } from './domain/transcription.port';
import { EVENT_EXTRACTION_PORT } from './domain/event-extraction.port';
import { CALENDAR_PORT } from './domain/calendar.port';
import { GroqTranscriptionAdapter } from './infrastructure/groq-transcription.adapter';
import { GroqEventExtractionAdapter } from './infrastructure/groq-event-extraction.adapter';
import { GoogleCalendarAdapter } from './infrastructure/google-calendar.adapter';

@Module({
  imports: [ConfigModule],
  controllers: [CaptureController],
  providers: [
    ExtractEventFromAudioUseCase,
    ConfirmEventUseCase,
    UndoCalendarEventUseCase,
    { provide: TRANSCRIPTION_PORT, useClass: GroqTranscriptionAdapter },
    { provide: EVENT_EXTRACTION_PORT, useClass: GroqEventExtractionAdapter },
    { provide: CALENDAR_PORT, useClass: GoogleCalendarAdapter },
  ],
})
export class CaptureModule {}
