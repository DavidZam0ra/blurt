import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GetPreferencesUseCase } from '../../core/use-cases/get-preferences.use-case';
import { UpdatePreferencesUseCase } from '../../core/use-cases/update-preferences.use-case';
import { ListCalendarsUseCase } from '../../core/use-cases/list-calendars.use-case';
import { SelectCalendarUseCase } from '../../core/use-cases/select-calendar.use-case';
import { ToastService } from '../../core/toast/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { GoogleCalendarListEntry } from '../../core/models/google-calendar';
import { CHANGELOG } from '../../core/models/changelog';
import {
  MAX_REMINDER_OFFSET_IN_MINUTES,
  REMINDER_CHOICES,
  reminderOffsetLabel,
} from '../../core/models/reminder-choice';

const MAX_REMINDER_COUNT = 5; // Google Calendar allows at most 5 reminder overrides per event.

type CustomUnit = 'minutes' | 'hours' | 'days';

const UNIT_MULTIPLIER: Record<CustomUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1440,
};

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private readonly getPreferences = inject(GetPreferencesUseCase);
  private readonly updatePreferences = inject(UpdatePreferencesUseCase);
  private readonly listCalendars = inject(ListCalendarsUseCase);
  private readonly selectCalendar = inject(SelectCalendarUseCase);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly appVersionLabel = CHANGELOG[0]?.label;
  protected readonly reminderChoices = REMINDER_CHOICES;
  protected readonly reminderOffsetLabel = reminderOffsetLabel;
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly defaultReminderOffsetsInMinutes = signal<number[]>([]);

  protected readonly isAddingCustom = signal(false);
  protected readonly customValue = signal(3);
  protected readonly customUnit = signal<CustomUnit>('days');

  protected readonly calendars = signal<GoogleCalendarListEntry[]>([]);
  protected readonly isLoadingCalendars = signal(true);
  protected readonly selectedCalendarId = signal<string | undefined>(undefined);
  protected readonly isSavingCalendar = signal(false);

  protected readonly isDeleteAccountOpen = signal(false);
  protected readonly isDeletingAccount = signal(false);

  async ngOnInit(): Promise<void> {
    this.selectedCalendarId.set(this.auth.currentUser()?.googleCalendarId);
    await Promise.all([this.loadPreferences(), this.loadCalendars()]);
  }

  private async loadPreferences(): Promise<void> {
    try {
      const preferences = await this.getPreferences.execute();
      this.defaultReminderOffsetsInMinutes.set(preferences.defaultReminderOffsetsInMinutes);
    } catch {
      this.toast.show('No se pudieron cargar tus ajustes');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadCalendars(): Promise<void> {
    try {
      this.calendars.set(await this.listCalendars.execute());
    } catch {
      this.toast.show('No se pudieron cargar tus calendarios — prueba a cerrar sesión y volver a entrar');
    } finally {
      this.isLoadingCalendars.set(false);
    }
  }

  protected async onCalendarChange(googleCalendarId: string): Promise<void> {
    const previous = this.selectedCalendarId();
    this.selectedCalendarId.set(googleCalendarId);
    this.isSavingCalendar.set(true);
    try {
      await this.selectCalendar.execute(googleCalendarId);
      this.toast.show('Calendario actualizado');
    } catch {
      this.selectedCalendarId.set(previous);
      this.toast.show('No se pudo cambiar el calendario');
    } finally {
      this.isSavingCalendar.set(false);
    }
  }

  protected openDeleteAccount(): void {
    this.isDeleteAccountOpen.set(true);
  }

  protected closeDeleteAccount(): void {
    this.isDeleteAccountOpen.set(false);
  }

  protected async confirmDeleteAccount(): Promise<void> {
    if (this.isDeletingAccount()) {
      return;
    }
    this.isDeletingAccount.set(true);
    try {
      await this.auth.deleteAccount();
      this.toast.show('Cuenta eliminada');
      await this.router.navigate(['/login']);
    } catch {
      this.toast.show('No se pudo eliminar la cuenta');
      this.isDeletingAccount.set(false);
    }
  }

  protected isSelected(minutes: number): boolean {
    return this.defaultReminderOffsetsInMinutes().includes(minutes);
  }

  protected async remove(minutes: number): Promise<void> {
    await this.applyChange(
      this.defaultReminderOffsetsInMinutes().filter((value) => value !== minutes),
    );
  }

  protected openCustomForm(): void {
    if (this.defaultReminderOffsetsInMinutes().length >= MAX_REMINDER_COUNT) {
      this.toast.show(`Máximo ${MAX_REMINDER_COUNT} recordatorios`);
      return;
    }
    this.isAddingCustom.set(true);
  }

  protected cancelCustomForm(): void {
    this.isAddingCustom.set(false);
  }

  protected async addCustom(): Promise<void> {
    const value = this.customValue();
    if (!value || value <= 0) {
      return;
    }
    const minutes = Math.round(value * UNIT_MULTIPLIER[this.customUnit()]);
    if (minutes > MAX_REMINDER_OFFSET_IN_MINUTES) {
      this.toast.show('Como mucho puede avisar 4 semanas antes');
      return;
    }
    const added = await this.add(minutes);
    if (added) {
      this.isAddingCustom.set(false);
    }
  }

  protected async add(minutes: number): Promise<boolean> {
    if (this.isSelected(minutes)) {
      return true;
    }
    if (this.defaultReminderOffsetsInMinutes().length >= MAX_REMINDER_COUNT) {
      this.toast.show(`Máximo ${MAX_REMINDER_COUNT} recordatorios`);
      return false;
    }
    await this.applyChange(
      [...this.defaultReminderOffsetsInMinutes(), minutes].sort((a, b) => a - b),
    );
    return true;
  }

  private async applyChange(next: number[]): Promise<void> {
    const previous = this.defaultReminderOffsetsInMinutes();
    this.defaultReminderOffsetsInMinutes.set(next);
    this.isSaving.set(true);
    try {
      await this.updatePreferences.execute({ defaultReminderOffsetsInMinutes: next });
      this.toast.show('Ajustes guardados');
    } catch {
      this.defaultReminderOffsetsInMinutes.set(previous);
      this.toast.show('No se pudo guardar');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async goBack(): Promise<void> {
    await this.router.navigate(['/']);
  }
}
