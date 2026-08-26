import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { hasCompletedOnboarding } from './onboarding-status';

export const onboardingGuard: CanActivateFn = () => {
  if (hasCompletedOnboarding()) {
    return true;
  }
  return inject(Router).createUrlTree(['/onboarding']);
};
