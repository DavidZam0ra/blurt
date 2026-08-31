import { Component, ElementRef, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ChangelogService } from '../../core/changelog/changelog.service';
import { ScrollLockService } from '../../core/scroll-lock/scroll-lock.service';

function initialsFor(name: string | undefined, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

@Component({
  selector: 'app-profile-menu',
  imports: [],
  templateUrl: './profile-menu.html',
  styleUrl: './profile-menu.scss',
})
export class ProfileMenu implements OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly changelog = inject(ChangelogService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly scrollLock = inject(ScrollLockService);

  protected readonly isOpen = signal(false);
  protected readonly isChangelogOpen = signal(false);

  ngOnDestroy(): void {
    if (this.isChangelogOpen()) {
      this.scrollLock.unlock();
    }
  }

  protected readonly initials = computed(() => {
    const user = this.auth.currentUser();
    return user ? initialsFor(user.name, user.email) : '';
  });

  protected toggleMenu(): void {
    this.isOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  protected openChangelog(): void {
    this.isOpen.set(false);
    this.isChangelogOpen.set(true);
    this.scrollLock.lock();
    this.changelog.markSeen();
  }

  protected closeChangelog(): void {
    this.isChangelogOpen.set(false);
    this.scrollLock.unlock();
  }

  protected async goToSettings(): Promise<void> {
    this.isOpen.set(false);
    await this.router.navigate(['/settings']);
  }

  protected async logout(): Promise<void> {
    this.isOpen.set(false);
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
