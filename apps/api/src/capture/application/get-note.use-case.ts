import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NOTE_REPOSITORY_PORT } from '../domain/note-repository.port';
import type { NoteRepositoryPort } from '../domain/note-repository.port';
import { Note } from '../domain/note';

@Injectable()
export class GetNoteUseCase {
  constructor(
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
  ) {}

  async execute(id: string, userId: string): Promise<Note> {
    const note = await this.noteRepository.findById(id, userId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }
}
