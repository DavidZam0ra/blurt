export const EVENT_CATEGORIES = ['work', 'food', 'health', 'personal', 'travel', 'uncategorized'] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
