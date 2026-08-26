import { ExtractedEvent } from './extracted-event';

export type NoteStatus = 'AwaitingConfirmation' | 'Synced' | 'Error';

export interface Note {
  id: string;
  userId: string;
  status: NoteStatus;
  candidateEvents: ExtractedEvent[];
  externalEventIds: string[];
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}
