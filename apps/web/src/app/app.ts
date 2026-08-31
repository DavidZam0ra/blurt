import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastService } from './core/toast/toast.service';
import { AuthService } from './core/auth/auth.service';

const PUBLIC_PATHS = ['/login', '/onboarding', '/privacy'];

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // The auth guard lets navigation through optimistically while the
    // session check is still pending (see auth.guard.ts). Once it resolves
    // and turns out the user isn't logged in, bounce them out here instead.
    effect(() => {
      if (!this.auth.authChecked() || this.auth.currentUser()) {
        return;
      }
      const currentUrl = this.router.url;
      if (!PUBLIC_PATHS.some((path) => currentUrl.startsWith(path))) {
        this.router.navigateByUrl('/login');
      }
    });
  }
}
