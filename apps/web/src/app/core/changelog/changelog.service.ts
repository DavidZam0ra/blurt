import { Injectable, computed, signal } from '@angular/core';
import { CHANGELOG } from '../models/changelog';

const STORAGE_KEY = 'blurt.changelog.lastSeen';

@Injectable({ providedIn: 'root' })
export class ChangelogService {
  readonly entries = CHANGELOG;
  private readonly latestVersion = CHANGELOG[0]?.version;

  private readonly lastSeenVersion = signal(
    typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY),
  );

  readonly hasUnseen = computed(
    () => !!this.latestVersion && this.lastSeenVersion() !== this.latestVersion,
  );

  markSeen(): void {
    if (!this.latestVersion) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, this.latestVersion);
    this.lastSeenVersion.set(this.latestVersion);
  }
}
