import { Inject, Injectable } from '@nestjs/common';
import { CALENDAR_PORT } from '../domain/calendar.port';
import type { CalendarPort } from '../domain/calendar.port';
import { NOTE_REPOSITORY_PORT } from '../domain/note-repository.port';
import type { NoteRepositoryPort } from '../domain/note-repository.port';
import { Note } from '../domain/note';
import { ExtractedEvent } from '../domain/extracted-event';
import { User } from '../../users/domain/user';
import { GoogleCredentialsResolver } from './google-credentials.resolver';

@Injectable()
export class ConfirmNoteUseCase {
  constructor(
    @Inject(CALENDAR_PORT) private readonly calendarPort: CalendarPort,
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
    private readonly credentialsResolver: GoogleCredentialsResolver,
  ) {}

  async execute(
    noteId: string,
    user: User,
    events: ExtractedEvent[],
  ): Promise<Note> {
    const credentials = this.credentialsResolver.resolve(user);
    const externalEventIds: string[] = [];

    try {
      for (const event of events) {
        externalEventIds.push(
          await this.calendarPort.createEvent(event, credentials),
        );
      }
      return this.noteRepository.update(noteId, user.id, {
        status: 'Synced',
        candidateEvents: events,
        externalEventIds,
      });
    } catch (error) {
      return this.noteRepository.update(noteId, user.id, {
        status: 'Error',
        candidateEvents: events,
        externalEventIds,
        errorMessage:
          error instanceof Error ? error.message : 'Failed to confirm event',
      });
    }
  }
}
