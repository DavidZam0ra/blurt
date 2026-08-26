import { Injectable, OnDestroy, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OnlineStatusService implements OnDestroy {
  readonly isOnline = signal(navigator.onLine);

  private readonly onOnline = () => this.isOnline.set(true);
  private readonly onOffline = () => this.isOnline.set(false);

  constructor() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }
}
