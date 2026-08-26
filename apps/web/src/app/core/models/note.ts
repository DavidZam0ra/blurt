import { ExtractedEvent } from './extracted-event';

export enum NoteStatus {
  AwaitingConfirmation = 'AwaitingConfirmation',
  Synced = 'Synced',
  Error = 'Error',
}

export interface Note {
  id: string;
  status: NoteStatus;
  candidateEvents: ExtractedEvent[];
  externalEventIds: string[];
  errorMessage?: string;
  createdAt: string;
}
