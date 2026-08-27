import { Inject, Injectable, Logger } from '@nestjs/common';
import { CALENDAR_PORT } from '../domain/calendar.port';
import type { CalendarPort } from '../domain/calendar.port';
import { NOTE_REPOSITORY_PORT } from '../domain/note-repository.port';
import type { NoteRepositoryPort } from '../domain/note-repository.port';
import { Note } from '../domain/note';
import { User } from '../../users/domain/user';
import { GoogleCredentialsResolver } from './google-credentials.resolver';

@Injectable()
export class ListNotesUseCase {
  private readonly logger = new Logger(ListNotesUseCase.name);

  constructor(
    @Inject(CALENDAR_PORT) private readonly calendarPort: CalendarPort,
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
    private readonly credentialsResolver: GoogleCredentialsResolver,
  ) {}

  async execute(user: User): Promise<Note[]> {
    const notes = await this.noteRepository.listByUser(user.id);
    const credentials = this.credentialsResolver.resolve(user);

    const checkable = notes.filter(
      (note) => note.status === 'Synced' && note.externalEventIds.length > 0,
    );
    const deleted = new Set(
      await this.filterDeletedInCalendar(checkable, credentials),
    );
    if (deleted.size > 0) {
      await Promise.all(
        [...deleted].map((noteId) => this.noteRepository.delete(noteId, user.id)),
      );
    }

    return notes.filter((note) => !deleted.has(note.id));
  }

  private async filterDeletedInCalendar(
    notes: Note[],
    credentials: ReturnType<GoogleCredentialsResolver['resolve']>,
  ): Promise<string[]> {
    const results = await Promise.all(
      notes.map(async (note) => ({
        noteId: note.id,
        wasDeleted: await this.wasDeletedInCalendar(note, credentials),
      })),
    );
    return results.filter((r) => r.wasDeleted).map((r) => r.noteId);
  }

  private async wasDeletedInCalendar(
    note: Note,
    credentials: ReturnType<GoogleCredentialsResolver['resolve']>,
  ): Promise<boolean> {
    try {
      const stillExist = await Promise.all(
        note.externalEventIds.map((externalEventId) =>
          this.calendarPort.eventExists(externalEventId, credentials),
        ),
      );
      return stillExist.every((exists) => !exists);
    } catch (error) {
      this.logger.warn(
        `Failed to check Calendar state for note ${note.id}, leaving it as-is: ${error instanceof Error ? error.message : error}`,
      );
      return false;
    }
  }
}
