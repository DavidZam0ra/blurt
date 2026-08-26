import { ExtractedEvent } from './extracted-event';
import { Note, NoteStatus } from './note';

export const NOTE_REPOSITORY_PORT = Symbol('NoteRepositoryPort');

export interface CreateNoteInput {
  userId: string;
  candidateEvents: ExtractedEvent[];
}

export interface UpdateNoteInput {
  status?: NoteStatus;
  candidateEvents?: ExtractedEvent[];
  externalEventIds?: string[];
  errorMessage?: string;
}

export interface NoteRepositoryPort {
  create(input: CreateNoteInput): Promise<Note>;
  findById(id: string, userId: string): Promise<Note | null>;
  listByUser(userId: string): Promise<Note[]>;
  update(id: string, userId: string, changes: UpdateNoteInput): Promise<Note>;
  delete(id: string, userId: string): Promise<void>;
}
