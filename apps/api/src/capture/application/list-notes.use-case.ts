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

    const survivors: Note[] = [];
    for (const note of notes) {
      if (note.status !== 'Synced' || note.externalEventIds.length === 0) {
        survivors.push(note);
        continue;
      }

      if (await this.wasDeletedInCalendar(note, credentials)) {
        await this.noteRepository.delete(note.id, user.id);
      } else {
        survivors.push(note);
      }
    }

    return survivors;
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
