import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SyncPendingNotesUseCase } from './core/use-cases/sync-pending-notes.use-case';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  private readonly syncPendingNotes = inject(SyncPendingNotesUseCase);
  private readonly onOnline = () => void this.syncPendingNotes.execute();
  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void this.syncPendingNotes.execute();
    }
  };

  ngOnInit(): void {
    void this.syncPendingNotes.execute();
    window.addEventListener('online', this.onOnline);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    window.removeEventListener('online', this.onOnline);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
