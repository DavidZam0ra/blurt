import { ExtractedEvent } from './extracted-event';

export enum VoiceNoteStatus {
  Pending = 'Pending',
  Uploading = 'Uploading',
  AwaitingConfirmation = 'AwaitingConfirmation',
  Confirmed = 'Confirmed',
  Synced = 'Synced',
  Error = 'Error',
}

export interface VoiceNote {
  id: string;
  audio: Blob;
  createdAt: number;
  status: VoiceNoteStatus;
  candidateEvents?: ExtractedEvent[];
  externalEventIds?: string[];
  errorMessage?: string;
}
