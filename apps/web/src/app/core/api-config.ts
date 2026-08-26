export let API_BASE_URL = 'http://localhost:3000';

export async function loadApiConfig(): Promise<void> {
  const response = await fetch('/api-config.json', { cache: 'no-store' });
  if (!response.ok) {
    return;
  }

  const config = (await response.json()) as { apiBaseUrl?: string };
  // '' is a valid, intentional value (same origin, no prefix) — only skip
  // the update when the key is genuinely absent from the JSON.
  if (config.apiBaseUrl !== undefined) {
    API_BASE_URL = config.apiBaseUrl.replace(/\/$/, '');
  }
}
