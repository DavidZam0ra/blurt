# Blurt

## Design system

UI work in this repo (mainly `apps/web`) follows the **Blurt Design System** ("Nocturne") Claude Design project — the source of truth for colors, type, spacing, radii, shadows, icons, and the logo/lockup.

- Project: https://claude.ai/design/p/1e2c5819-58ae-4a57-bab0-208da6b7fc40
- Marked as the default design system for this account
- `readme.md` — usage rules and token conventions
- `foundations/logo.html` — mark/lockup sizing and placement rules (e.g. nav-brand lockup, minimum clear sizes)
- `foundations/*.html`, `components/*.html` — type, color, layout, icons, buttons, forms, cards, navigation, table, dialog
- `styles.css` — the actual token sheet (`--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`)

Before hand-rolling a size, color, or spacing value in `apps/web`, check the matching foundations/components page in this project rather than guessing.
