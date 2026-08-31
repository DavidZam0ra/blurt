import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);

  /**
   * Installed-to-homescreen PWAs never really "close", so a background tab
   * left open for days kept serving a stale cached version until the user
   * removed and re-added the icon. This watches for new versions and swaps
   * them in automatically — no manual reinstall needed.
   */
  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        void this.swUpdate.activateUpdate().then(() => this.reloadWhenSafe());
      });
  }

  private reloadWhenSafe(): void {
    // Reloading mid-session (e.g. mid-recording) would lose whatever the user
    // is doing, so wait for the app to be backgrounded — reopening it from a
    // home-screen icon after that is the natural, unnoticeable moment to pick
    // up the new version, same as any other app updating between launches.
    if (document.hidden) {
      document.location.reload();
      return;
    }
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          document.location.reload();
        }
      },
      { once: true },
    );
  }
}
