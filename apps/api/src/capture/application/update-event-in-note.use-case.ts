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
import { ExtractedEvent } from '../domain/extracted-event';
import { User } from '../../users/domain/user';
import { GoogleCredentialsResolver } from './google-credentials.resolver';

@Injectable()
export class UpdateEventInNoteUseCase {
  constructor(
    @Inject(CALENDAR_PORT) private readonly calendarPort: CalendarPort,
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
    private readonly credentialsResolver: GoogleCredentialsResolver,
  ) {}

  /**
   * Edits a single event already stored on a note. If that event has a
   * matching calendar entry (its index falls within externalEventIds — see
   * RemoveEventFromNoteUseCase for why that can be shorter than
   * candidateEvents), the real Google Calendar event is updated first; the
   * note is only persisted once that succeeds, so local state never drifts
   * from what's actually on the calendar.
   */
  async execute(
    noteId: string,
    user: User,
    eventIndex: number,
    updatedEvent: ExtractedEvent,
  ): Promise<Note> {
    const note = await this.noteRepository.findById(noteId, user.id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    if (eventIndex < 0 || eventIndex >= note.candidateEvents.length) {
      throw new BadRequestException('Invalid event index');
    }

    if (eventIndex < note.externalEventIds.length) {
      const credentials = this.credentialsResolver.resolve(user);
      await this.calendarPort.updateEvent(
        note.externalEventIds[eventIndex],
        updatedEvent,
        credentials,
      );
    }

    const candidateEvents = note.candidateEvents.map((event, i) =>
      i === eventIndex ? updatedEvent : event,
    );
    return this.noteRepository.update(noteId, user.id, { candidateEvents });
  }
}
