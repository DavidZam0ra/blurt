import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth, calendar, calendar_v3 } from '@googleapis/calendar';
import {
  CalendarPort,
  GoogleCalendarCredentials,
} from '../domain/calendar.port';
import { ExtractedEvent } from '../domain/extracted-event';
import { EventRecurrence } from '../domain/event-recurrence';

const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;
const DEFAULT_TIME_ZONE = 'UTC';
// Google Calendar "Lavender" — closest match to the app's accent color (#9184d9).
const BLURT_EVENT_COLOR_ID = '1';
const RRULE_WEEKDAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const RRULE_FREQUENCY: Record<EventRecurrence['frequency'], string> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

@Injectable()
export class GoogleCalendarAdapter implements CalendarPort {
  private readonly logger = new Logger(GoogleCalendarAdapter.name);
  // Keyed by refresh token: an OAuth2Client caches the access token it gets
  // back from Google in memory, so reusing the same instance across calls
  // (within one request and across later ones) avoids re-exchanging the
  // refresh token for a new access token every single time.
  private readonly clientsByRefreshToken = new Map<
    string,
    InstanceType<typeof auth.OAuth2>
  >();

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
    let oauth2Client = this.clientsByRefreshToken.get(
      credentials.refreshToken,
    );
    if (!oauth2Client) {
      oauth2Client = new auth.OAuth2({
        clientId: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        clientSecret: this.configService.getOrThrow<string>(
          'GOOGLE_CLIENT_SECRET',
        ),
      });
      oauth2Client.setCredentials({
        refresh_token: credentials.refreshToken,
      });
      this.clientsByRefreshToken.set(credentials.refreshToken, oauth2Client);
    }
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
    const timeZone = event.timeZone ?? DEFAULT_TIME_ZONE;

    if (event.endDate) {
      // All-day events are date-only in Google's API — no dateTime, no
      // timeZone, and "end.date" is exclusive (the day AFTER the last day
      // the event should show on).
      const startDate = toLocalWallClockString(
        new Date(event.startDateTime),
        timeZone,
      ).slice(0, 10);
      return {
        summary: event.title,
        start: { date: startDate },
        end: { date: addOneDay(event.endDate) },
        colorId: BLURT_EVENT_COLOR_ID,
        reminders: this.toGoogleReminders(event.reminderOffsetsInMinutes),
      };
    }

    const start = new Date(event.startDateTime);
    const durationMs = event.durationInMinutes
      ? event.durationInMinutes * 60 * 1000
      : DEFAULT_EVENT_DURATION_MS;
    const end = new Date(start.getTime() + durationMs);

    return {
      summary: event.title,
      // A floating local wall-clock dateTime (no "Z"/offset) paired with timeZone —
      // not a "Z"-suffixed UTC instant — is what Google Calendar expects; pairing an
      // absolute UTC instant with a timeZone is what triggers "Invalid recurrence rule"
      // once the event carries an RRULE, so we use the same floating format always.
      start: { dateTime: toLocalWallClockString(start, timeZone), timeZone },
      end: { dateTime: toLocalWallClockString(end, timeZone), timeZone },
      colorId: BLURT_EVENT_COLOR_ID,
      reminders: this.toGoogleReminders(event.reminderOffsetsInMinutes),
      recurrence: event.recurrence ? [buildRRule(event.recurrence)] : undefined,
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

function buildRRule(recurrence: EventRecurrence): string {
  const parts = [`FREQ=${RRULE_FREQUENCY[recurrence.frequency]}`];

  if (recurrence.interval && recurrence.interval > 1) {
    parts.push(`INTERVAL=${recurrence.interval}`);
  }
  if (recurrence.byDayOfWeek?.length) {
    parts.push(
      `BYDAY=${recurrence.byDayOfWeek.map((day) => RRULE_WEEKDAY_CODES[day]).join(',')}`,
    );
  }
  // RRULE forbids setting both COUNT and UNTIL — count wins if both are present.
  if (recurrence.count) {
    parts.push(`COUNT=${recurrence.count}`);
  } else if (recurrence.until) {
    parts.push(`UNTIL=${toRRuleUntil(recurrence.until)}`);
  }

  // Google's `recurrence` array holds full iCalendar lines, not bare "field=value"
  // pairs — without the "RRULE:" property prefix it's rejected as invalid.
  return `RRULE:${parts.join(';')}`;
}

function addOneDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function toRRuleUntil(isoDateTime: string): string {
  return isoDateTime.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function toLocalWallClockString(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}
