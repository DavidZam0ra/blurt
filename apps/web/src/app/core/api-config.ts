export let API_BASE_URL = 'http://localhost:3000';

export const DEFAULT_CALENDAR_ID = 'primary';

export async function loadApiConfig(): Promise<void> {
  const response = await fetch('/api-config.json', { cache: 'no-store' });
  if (!response.ok) {
    return;
  }

  const config = (await response.json()) as { apiBaseUrl?: string };
  if (config.apiBaseUrl) {
    API_BASE_URL = config.apiBaseUrl.replace(/\/$/, '');
  }
}
