import { Inject, Injectable } from '@nestjs/common';
import { NOTE_REPOSITORY_PORT } from '../domain/note-repository.port';
import type { NoteRepositoryPort } from '../domain/note-repository.port';
import { Note } from '../domain/note';
import { ExtractedEvent } from '../domain/extracted-event';

@Injectable()
export class CreateNoteUseCase {
  constructor(
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
  ) {}

  execute(userId: string, candidateEvents: ExtractedEvent[]): Promise<Note> {
    return this.noteRepository.create({ userId, candidateEvents });
  }
}
