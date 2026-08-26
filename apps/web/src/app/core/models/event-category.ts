export const EVENT_CATEGORIES = ['work', 'food', 'health', 'personal', 'travel', 'uncategorized'] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  work: 'Trabajo',
  food: 'Comida',
  health: 'Salud',
  personal: 'Personal',
  travel: 'Viaje',
  uncategorized: 'Sin categoría',
};
