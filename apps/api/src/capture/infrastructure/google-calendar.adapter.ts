import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth, calendar, calendar_v3 } from '@googleapis/calendar';
import { CalendarPort } from '../domain/calendar.port';
import { ExtractedEvent } from '../domain/extracted-event';

const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;
const DEFAULT_CALENDAR_ID = 'primary';
// Google Calendar "Lavender" — closest match to the app's accent color (#9184d9).
const BLURT_EVENT_COLOR_ID = '1';

@Injectable()
export class GoogleCalendarAdapter implements CalendarPort {
  private readonly logger = new Logger(GoogleCalendarAdapter.name);
  private readonly calendar: calendar_v3.Calendar;
  private readonly defaultCalendarId: string;

  constructor(configService: ConfigService) {
    const oauth2Client = new auth.OAuth2({
      clientId: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
    });
    oauth2Client.setCredentials({
      refresh_token: configService.getOrThrow<string>('GOOGLE_REFRESH_TOKEN'),
    });

    this.calendar = calendar({ version: 'v3', auth: oauth2Client });
    this.defaultCalendarId =
      configService.get<string>('GOOGLE_CALENDAR_ID') ?? DEFAULT_CALENDAR_ID;
  }

  async createEvent(
    event: ExtractedEvent,
    calendarId: string,
  ): Promise<string> {
    const { data } = await this.calendar.events.insert({
      calendarId,
      requestBody: this.toGoogleEvent(event),
    });

    if (!data.id) {
      throw new Error('Google Calendar did not return an event id');
    }

    this.logger.log(
      `createEvent(calendarId=${calendarId}, title="${event.title}", startDateTime=${event.startDateTime}) -> ${data.id}`,
    );
    return data.id;
  }

  async deleteEvent(externalEventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: this.defaultCalendarId,
        eventId: externalEventId,
      });
      this.logger.log(`deleteEvent(externalEventId=${externalEventId})`);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        this.logger.warn(
          `deleteEvent(externalEventId=${externalEventId}) -> already gone, skipping`,
        );
        return;
      }
      throw error;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      Number((error as { code: unknown }).code) === 404
    );
  }

  private toGoogleEvent(event: ExtractedEvent): calendar_v3.Schema$Event {
    const start = new Date(event.startDateTime);
    const end = new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);

    return {
      summary: event.title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      colorId: BLURT_EVENT_COLOR_ID,
      reminders: this.toGoogleReminders(event.reminderOffsetsInMinutes),
    };
  }

  private toGoogleReminders(
    reminderOffsetsInMinutes: number[],
  ): calendar_v3.Schema$Event['reminders'] {
    if (reminderOffsetsInMinutes.length === 0) {
      return { useDefault: true };
    }

    return {
      useDefault: false,
      overrides: reminderOffsetsInMinutes.map((minutes) => ({
        method: 'popup',
        minutes,
      })),
    };
  }
}
