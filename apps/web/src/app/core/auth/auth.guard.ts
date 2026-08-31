import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  // Optimistic: while the session check is still in flight (e.g. Render's
  // free-tier cold start), let the user in rather than block on it. App
  // watches authChecked()/currentUser() and bounces to /login if the check
  // later comes back negative.
  if (auth.authChecked() && !auth.currentUser()) {
    return inject(Router).createUrlTree(['/login']);
  }
  return true;
};
