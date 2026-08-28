export const RECURRENCE_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export interface EventRecurrence {
  frequency: RecurrenceFrequency;
  interval?: number;
  byDayOfWeek?: number[];
  count?: number;
  until?: string;
}
