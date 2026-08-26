import { Routes } from '@angular/router';
import { Record } from './features/record/record';
import { Confirm } from './features/confirm/confirm';
import { History } from './features/history/history';
import { Onboarding } from './features/onboarding/onboarding';
import { onboardingGuard } from './core/onboarding/onboarding.guard';

export const routes: Routes = [
  { path: 'onboarding', component: Onboarding },
  { path: '', component: Record, canActivate: [onboardingGuard] },
  { path: 'confirm/:id', component: Confirm, canActivate: [onboardingGuard] },
  { path: 'history', component: History, canActivate: [onboardingGuard] },
];
