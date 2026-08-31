import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export const CALENDAR_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
  // Read-only access to the list of the user's calendars — needed for the
  // "which calendar do you want to save to" picker in Settings. Narrower
  // than 'calendar.readonly' (which would also read event contents).
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
];

@Injectable()
export class GoogleOAuthClientFactory {
  constructor(private readonly configService: ConfigService) {}

  get clientId(): string {
    return this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
  }

  create(): OAuth2Client {
    return new OAuth2Client(
      this.clientId,
      this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      this.redirectUri(),
    );
  }

  private redirectUri(): string {
    const apiOrigin =
      this.configService.get<string>('RENDER_EXTERNAL_URL') ??
      'http://localhost:3000';
    return `${apiOrigin}/auth/google/callback`;
  }
}
