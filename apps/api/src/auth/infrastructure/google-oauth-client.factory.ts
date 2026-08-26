import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export const CALENDAR_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
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
    // In production the whole OAuth round-trip is proxied through blurt-web's
    // own origin (render.yaml routes /api/* there to blurt-api), so an
    // installed PWA never navigates cross-origin and iOS never kicks the
    // user out to Safari mid-login. Locally there's no such proxy, so we
    // talk to the API directly instead.
    const renderExternalUrl = this.configService.get<string>(
      'RENDER_EXTERNAL_URL',
    );
    if (!renderExternalUrl) {
      return 'http://localhost:3000/auth/google/callback';
    }

    const webOrigin = this.configService.getOrThrow<string>('WEB_ORIGIN');
    return `${webOrigin}/api/auth/google/callback`;
  }
}
