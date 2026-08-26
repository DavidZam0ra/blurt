import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { markOnboardingCompleted } from '../../core/onboarding/onboarding-status';

@Component({
  selector: 'app-onboarding',
  imports: [],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding {
  private readonly router = inject(Router);

  protected readonly step = signal<1 | 2>(1);

  protected goToStep2(): void {
    this.step.set(2);
  }

  protected async requestMicrophoneAccess(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      // The user can still grant access later, when actually recording.
    }
    await this.finish();
  }

  protected async finish(): Promise<void> {
    markOnboardingCompleted();
    await this.router.navigate(['/login']);
  }
}
