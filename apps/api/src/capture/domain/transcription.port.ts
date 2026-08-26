export const TRANSCRIPTION_PORT = Symbol('TranscriptionPort');

export interface TranscriptionPort {
  transcribe(audio: Buffer, fileName: string): Promise<string>;
}
