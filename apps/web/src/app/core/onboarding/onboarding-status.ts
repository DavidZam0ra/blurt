const ONBOARDED_STORAGE_KEY = 'blurt.onboarded';

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDED_STORAGE_KEY) === 'true';
}

export function markOnboardingCompleted(): void {
  localStorage.setItem(ONBOARDED_STORAGE_KEY, 'true');
}
