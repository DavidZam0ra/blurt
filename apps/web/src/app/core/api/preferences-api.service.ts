import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api-config';
import { UserPreferences } from '../models/user-preferences';

@Injectable({ providedIn: 'root' })
export class PreferencesApiService {
  private readonly http = inject(HttpClient);

  getPreferences(): Promise<UserPreferences> {
    return firstValueFrom(
      this.http.get<UserPreferences>(`${API_BASE_URL}/auth/me/preferences`),
    );
  }

  updatePreferences(preferences: UserPreferences): Promise<UserPreferences> {
    return firstValueFrom(
      this.http.patch<UserPreferences>(`${API_BASE_URL}/auth/me/preferences`, preferences),
    );
  }
}
