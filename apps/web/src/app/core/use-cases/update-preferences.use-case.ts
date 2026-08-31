import { Injectable, inject } from '@angular/core';
import { PreferencesApiService } from '../api/preferences-api.service';
import { UserPreferences } from '../models/user-preferences';

@Injectable({ providedIn: 'root' })
export class UpdatePreferencesUseCase {
  private readonly preferencesApi = inject(PreferencesApiService);

  execute(preferences: UserPreferences): Promise<UserPreferences> {
    return this.preferencesApi.updatePreferences(preferences);
  }
}
