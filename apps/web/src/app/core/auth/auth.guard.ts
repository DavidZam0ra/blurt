import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  if (inject(AuthService).currentUser()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login']);
};
