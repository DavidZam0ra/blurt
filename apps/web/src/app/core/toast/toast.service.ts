import { Injectable, signal } from '@angular/core';

const TOAST_DURATION_IN_MS = 2200;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly text = signal<string | null>(null);

  private timeoutId?: ReturnType<typeof setTimeout>;

  show(text: string): void {
    clearTimeout(this.timeoutId);
    this.text.set(text);
    this.timeoutId = setTimeout(() => this.text.set(null), TOAST_DURATION_IN_MS);
  }
}
