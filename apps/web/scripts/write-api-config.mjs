import { mkdirSync, writeFileSync } from 'node:fs';

const apiBaseUrl = (process.env.API_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

if (process.env.RENDER && !process.env.API_BASE_URL) {
  console.error('API_BASE_URL is required on Render');
  process.exit(1);
}

mkdirSync('public', { recursive: true });
writeFileSync(
  'public/api-config.json',
  `${JSON.stringify({ apiBaseUrl }, null, 2)}\n`,
);
console.log(`Wrote public/api-config.json -> ${apiBaseUrl}`);
