import { Injectable, inject } from '@angular/core';
import { PreferencesApiService } from '../api/preferences-api.service';
import { UserPreferences } from '../models/user-preferences';

@Injectable({ providedIn: 'root' })
export class GetPreferencesUseCase {
  private readonly preferencesApi = inject(PreferencesApiService);

  execute(): Promise<UserPreferences> {
    return this.preferencesApi.getPreferences();
  }
}
