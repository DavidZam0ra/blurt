import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CALENDAR_PORT } from '../domain/calendar.port';
import type { CalendarPort } from '../domain/calendar.port';
import { NOTE_REPOSITORY_PORT } from '../domain/note-repository.port';
import type { NoteRepositoryPort } from '../domain/note-repository.port';
import { Note } from '../domain/note';
import { User } from '../../users/domain/user';
import { GoogleCredentialsResolver } from './google-credentials.resolver';

@Injectable()
export class UndoNoteUseCase {
  constructor(
    @Inject(CALENDAR_PORT) private readonly calendarPort: CalendarPort,
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
    private readonly credentialsResolver: GoogleCredentialsResolver,
  ) {}

  async execute(noteId: string, user: User): Promise<Note> {
    const note = await this.noteRepository.findById(noteId, user.id);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const credentials = this.credentialsResolver.resolve(user);
    for (const externalEventId of note.externalEventIds) {
      await this.calendarPort.deleteEvent(externalEventId, credentials);
    }

    return this.noteRepository.update(noteId, user.id, {
      status: 'AwaitingConfirmation',
      externalEventIds: [],
    });
  }
}
