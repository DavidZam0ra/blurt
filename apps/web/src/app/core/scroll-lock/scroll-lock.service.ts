import { Injectable } from '@angular/core';

/**
 * Locks page scroll while a full-screen overlay (a modal backdrop) is open —
 * without it, touch-scrolling on mobile still moves the page behind a
 * "fixed" backdrop. Reference-counted so two overlays opening in quick
 * succession (or a component being destroyed mid-open) can't unlock the
 * page while another one is still showing.
 */
@Injectable({ providedIn: 'root' })
export class ScrollLockService {
  private lockCount = 0;

  lock(): void {
    this.lockCount++;
    document.body.style.overflow = 'hidden';
  }

  unlock(): void {
    if (this.lockCount === 0) {
      return;
    }
    this.lockCount--;
    if (this.lockCount === 0) {
      document.body.style.overflow = '';
    }
  }
}
