import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CryptoModule } from '../shared/crypto/crypto.module';
import { CaptureController } from './infrastructure/capture.controller';
import { NotesController } from './infrastructure/notes.controller';
import { ExtractEventFromAudioUseCase } from './application/extract-event-from-audio.use-case';
import { CreateNoteUseCase } from './application/create-note.use-case';
import { ListNotesUseCase } from './application/list-notes.use-case';
import { GetNoteUseCase } from './application/get-note.use-case';
import { ConfirmNoteUseCase } from './application/confirm-note.use-case';
import { UndoNoteUseCase } from './application/undo-note.use-case';
import { DeleteNoteUseCase } from './application/delete-note.use-case';
import { GoogleCredentialsResolver } from './application/google-credentials.resolver';
import { TRANSCRIPTION_PORT } from './domain/transcription.port';
import { EVENT_EXTRACTION_PORT } from './domain/event-extraction.port';
import { CALENDAR_PORT } from './domain/calendar.port';
import { NOTE_REPOSITORY_PORT } from './domain/note-repository.port';
import { GroqTranscriptionAdapter } from './infrastructure/groq-transcription.adapter';
import { GroqEventExtractionAdapter } from './infrastructure/groq-event-extraction.adapter';
import { GoogleCalendarAdapter } from './infrastructure/google-calendar.adapter';
import { NoteEntity, NoteSchema } from './infrastructure/mongoose/note.schema';
import { NoteMongooseAdapter } from './infrastructure/mongoose/note-mongoose.adapter';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    CryptoModule,
    MongooseModule.forFeature([{ name: NoteEntity.name, schema: NoteSchema }]),
  ],
  controllers: [CaptureController, NotesController],
  providers: [
    ExtractEventFromAudioUseCase,
    CreateNoteUseCase,
    ListNotesUseCase,
    GetNoteUseCase,
    ConfirmNoteUseCase,
    UndoNoteUseCase,
    DeleteNoteUseCase,
    GoogleCredentialsResolver,
    { provide: TRANSCRIPTION_PORT, useClass: GroqTranscriptionAdapter },
    { provide: EVENT_EXTRACTION_PORT, useClass: GroqEventExtractionAdapter },
    { provide: CALENDAR_PORT, useClass: GoogleCalendarAdapter },
    { provide: NOTE_REPOSITORY_PORT, useClass: NoteMongooseAdapter },
  ],
})
export class CaptureModule {}
