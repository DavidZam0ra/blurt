import { Inject, Injectable } from '@nestjs/common';
import { NOTE_REPOSITORY_PORT } from '../domain/note-repository.port';
import type { NoteRepositoryPort } from '../domain/note-repository.port';
import { Note } from '../domain/note';

@Injectable()
export class ListNotesUseCase {
  constructor(
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
  ) {}

  execute(userId: string): Promise<Note[]> {
    return this.noteRepository.listByUser(userId);
  }
}
