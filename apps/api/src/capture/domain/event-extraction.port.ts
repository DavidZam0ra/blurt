import { ExtractedEvent } from './extracted-event';

export const EVENT_EXTRACTION_PORT = Symbol('EventExtractionPort');

export interface EventExtractionPort {
  extract(
    transcript: string,
    referenceDateTime: Date,
    timeZone: string,
    defaultReminderOffsetsInMinutes: number[],
  ): Promise<ExtractedEvent[]>;
}
