import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CALENDAR_PORT } from '../domain/calendar.port';
import type { CalendarPort } from '../domain/calendar.port';
import { NOTE_REPOSITORY_PORT } from '../domain/note-repository.port';
import type { NoteRepositoryPort } from '../domain/note-repository.port';
import { Note } from '../domain/note';
import { User } from '../../users/domain/user';
import { GoogleCredentialsResolver } from './google-credentials.resolver';

@Injectable()
export class RemoveEventFromNoteUseCase {
  constructor(
    @Inject(CALENDAR_PORT) private readonly calendarPort: CalendarPort,
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
    private readonly credentialsResolver: GoogleCredentialsResolver,
  ) {}

  /**
   * Removes a single event from a note — deleting its calendar entry first if
   * it has one. externalEventIds can be shorter than candidateEvents (a
   * partially-failed confirm only synced a prefix), so an event only "has" a
   * calendar entry when its index still falls within externalEventIds.
   * Returns null when this was the note's last event, since the note itself
   * gets deleted rather than left with an empty candidateEvents array.
   */
  async execute(
    noteId: string,
    user: User,
    eventIndex: number,
  ): Promise<Note | null> {
    const note = await this.noteRepository.findById(noteId, user.id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    if (eventIndex < 0 || eventIndex >= note.candidateEvents.length) {
      throw new BadRequestException('Invalid event index');
    }

    const hasExternalEventId = eventIndex < note.externalEventIds.length;
    if (hasExternalEventId) {
      const credentials = this.credentialsResolver.resolve(user);
      await this.calendarPort.deleteEvent(
        note.externalEventIds[eventIndex],
        credentials,
      );
    }

    const candidateEvents = note.candidateEvents.filter(
      (_, i) => i !== eventIndex,
    );
    const externalEventIds = hasExternalEventId
      ? note.externalEventIds.filter((_, i) => i !== eventIndex)
      : note.externalEventIds;

    if (candidateEvents.length === 0) {
      await this.noteRepository.delete(noteId, user.id);
      return null;
    }

    return this.noteRepository.update(noteId, user.id, {
      candidateEvents,
      externalEventIds,
    });
  }
}
