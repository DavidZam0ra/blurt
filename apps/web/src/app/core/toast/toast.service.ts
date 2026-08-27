import { Injectable, signal } from '@angular/core';

const TOAST_DURATION_IN_MS = 2200;
const ACTION_TOAST_DURATION_IN_MS = 5000;
const PROGRESS_TICK_IN_MS = 50;

export interface ActionToast {
  text: string;
  actionLabel: string;
  onAction: () => void;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly text = signal<string | null>(null);
  readonly actionToast = signal<ActionToast | null>(null);
  readonly progress = signal(1);

  private timeoutId?: ReturnType<typeof setTimeout>;
  private intervalId?: ReturnType<typeof setInterval>;
  private pendingCommit?: () => void;

  show(text: string): void {
    this.settlePendingAction();
    clearTimeout(this.timeoutId);
    this.actionToast.set(null);
    this.text.set(text);
    this.timeoutId = setTimeout(() => this.text.set(null), TOAST_DURATION_IN_MS);
  }

  /**
   * Shows a toast with an undo window: `onCommit` fires automatically once the
   * progress bar finishes, unless the user clicks the action button first, in
   * which case `onUndo` fires instead. Starting a new action toast (or a plain
   * one) immediately commits any action toast still pending.
   */
  showAction(
    text: string,
    actionLabel: string,
    onUndo: () => void,
    onCommit: () => void,
    durationMs = ACTION_TOAST_DURATION_IN_MS,
  ): void {
    this.settlePendingAction();
    clearTimeout(this.timeoutId);
    this.text.set(null);
    this.progress.set(1);
    this.pendingCommit = onCommit;

    this.actionToast.set({
      text,
      actionLabel,
      onAction: () => {
        clearInterval(this.intervalId);
        this.pendingCommit = undefined;
        this.actionToast.set(null);
        onUndo();
      },
    });

    const start = Date.now();
    this.intervalId = setInterval(() => {
      const remaining = Math.max(0, 1 - (Date.now() - start) / durationMs);
      this.progress.set(remaining);
      if (remaining === 0) {
        clearInterval(this.intervalId);
        this.pendingCommit = undefined;
        this.actionToast.set(null);
        onCommit();
      }
    }, PROGRESS_TICK_IN_MS);
  }

  private settlePendingAction(): void {
    if (!this.pendingCommit) {
      return;
    }
    clearInterval(this.intervalId);
    const commit = this.pendingCommit;
    this.pendingCommit = undefined;
    commit();
  }
}
