export interface ReminderChoice {
  label: string;
  minutes: number;
}

export const REMINDER_CHOICES: ReminderChoice[] = [
  { label: '15 min antes', minutes: 15 },
  { label: '30 min antes', minutes: 30 },
  { label: '1 h antes', minutes: 60 },
  { label: '1 día antes', minutes: 1440 },
  { label: '1 semana antes', minutes: 10080 },
];

// Google Calendar's own cap on how far in advance a reminder can fire.
export const MAX_REMINDER_OFFSET_IN_MINUTES = 40320; // 4 weeks

/** Formats any reminder offset (preset or custom) as a Spanish label, e.g. 90 -> "1 h 30 min antes". */
export function reminderOffsetLabel(minutes: number): string {
  if (minutes <= 0) {
    return 'En el momento del evento';
  }
  if (minutes % 10080 === 0) {
    const weeks = minutes / 10080;
    return `${weeks} semana${weeks > 1 ? 's' : ''} antes`;
  }
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} día${days > 1 ? 's' : ''} antes`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} h antes`;
  }
  if (minutes > 60) {
    return `${Math.floor(minutes / 60)} h ${minutes % 60} min antes`;
  }
  return `${minutes} min antes`;
}
