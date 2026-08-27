import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth, calendar, calendar_v3 } from '@googleapis/calendar';
import {
  CalendarPort,
  GoogleCalendarCredentials,
} from '../domain/calendar.port';
import { ExtractedEvent } from '../domain/extracted-event';

const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;
// Google Calendar "Lavender" — closest match to the app's accent color (#9184d9).
const BLURT_EVENT_COLOR_ID = '1';

@Injectable()
export class GoogleCalendarAdapter implements CalendarPort {
  private readonly logger = new Logger(GoogleCalendarAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async createEvent(
    event: ExtractedEvent,
    credentials: GoogleCalendarCredentials,
  ): Promise<string> {
    const { data } = await this.client(credentials).events.insert({
      calendarId: credentials.calendarId,
      requestBody: this.toGoogleEvent(event),
    });

    if (!data.id) {
      throw new Error('Google Calendar did not return an event id');
    }

    this.logger.log(
      `createEvent(calendarId=${credentials.calendarId}, title="${event.title}", startDateTime=${event.startDateTime}) -> ${data.id}`,
    );
    return data.id;
  }

  async deleteEvent(
    externalEventId: string,
    credentials: GoogleCalendarCredentials,
  ): Promise<void> {
    try {
      await this.client(credentials).events.delete({
        calendarId: credentials.calendarId,
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

  async eventExists(
    externalEventId: string,
    credentials: GoogleCalendarCredentials,
  ): Promise<boolean> {
    try {
      const { data } = await this.client(credentials).events.get({
        calendarId: credentials.calendarId,
        eventId: externalEventId,
      });
      // A deleted single (non-recurring) event usually 404s, but Google
      // sometimes keeps a tombstone around with status "cancelled" instead.
      return data.status !== 'cancelled';
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  private client(credentials: GoogleCalendarCredentials): calendar_v3.Calendar {
    const oauth2Client = new auth.OAuth2({
      clientId: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.getOrThrow<string>(
        'GOOGLE_CLIENT_SECRET',
      ),
    });
    oauth2Client.setCredentials({ refresh_token: credentials.refreshToken });
    return calendar({ version: 'v3', auth: oauth2Client });
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      Number(error.code) === 404
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
