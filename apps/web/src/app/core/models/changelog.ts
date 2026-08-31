export interface ChangelogEntry {
  /** Internal id, only ever compared for equality against what's stored locally — never parsed or shown. */
  version: string;
  /** Shown to the user, e.g. "v1.1". */
  label: string;
  date: string;
  items: string[];
}

// Newest first.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2026-08-31',
    label: 'v1.1',
    date: '31 ago 2026',
    items: [
      'Ajustes: elige tus recordatorios por defecto (incluye uno personalizado) y edita tu perfil',
      'Los planes ya guardados se pueden editar desde el Historial',
      'Entiende duraciones ("durante 2 horas") y rangos de varios días ("del 24 al 27")',
      'Arranque más rápido y ejemplos rotativos en la pantalla de grabar',
    ],
  },
];
