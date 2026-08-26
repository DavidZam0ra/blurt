import { Routes } from '@angular/router';
import { Record } from './features/record/record';
import { Confirm } from './features/confirm/confirm';
import { History } from './features/history/history';
import { Onboarding } from './features/onboarding/onboarding';
import { Login } from './features/login/login';
import { onboardingGuard } from './core/onboarding/onboarding.guard';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'onboarding', component: Onboarding },
  { path: 'login', component: Login },
  { path: '', component: Record, canActivate: [onboardingGuard, authGuard] },
  { path: 'confirm/:id', component: Confirm, canActivate: [onboardingGuard, authGuard] },
  { path: 'history', component: History, canActivate: [onboardingGuard, authGuard] },
];
