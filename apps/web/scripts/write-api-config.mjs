import { mkdirSync, writeFileSync } from 'node:fs';

// '' is a valid, intentional value — it means "same origin as the API,
// no prefix" (the API serves this app's static build directly in
// production). Only fall back to localhost when the var is truly unset.
const apiBaseUrl = (process.env.API_BASE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

if (process.env.RENDER && process.env.API_BASE_URL === undefined) {
  console.error('API_BASE_URL is required on Render');
  process.exit(1);
}

mkdirSync('public', { recursive: true });
writeFileSync(
  'public/api-config.json',
  `${JSON.stringify({ apiBaseUrl }, null, 2)}\n`,
);
console.log(`Wrote public/api-config.json -> ${apiBaseUrl}`);
