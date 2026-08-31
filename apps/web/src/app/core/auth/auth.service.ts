import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { PublicUser } from './public-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<PublicUser | null>(null);
  readonly authChecked = signal(false);

  async loadCurrentUser(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<PublicUser>(`${API_BASE_URL}/auth/me`),
      );
      this.currentUser.set(user);
    } catch {
      this.currentUser.set(null);
    } finally {
      this.authChecked.set(true);
    }
  }

  redirectToGoogle(): void {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post(`${API_BASE_URL}/auth/logout`, {}));
    this.currentUser.set(null);
  }
}
