import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';

const SESSION_MAX_AGE_IN_MS = 30 * 24 * 60 * 60 * 1000;
const STATE_MAX_AGE_IN_MS = 5 * 60 * 1000;

function isProduction(configService: ConfigService): boolean {
  return configService.get<string>('NODE_ENV') === 'production';
}

// In production the OAuth round-trip is proxied through blurt-web's own
// origin (render.yaml routes /api/* to blurt-api — see
// GoogleOAuthClientFactory.redirectUri), so cookie paths must match what the
// browser actually sees (/api/auth/google), not the API's own internal
// route (/auth/google). Locally there's no proxy, so it's the bare route.
export function oauthStatePath(configService: ConfigService): string {
  return configService.get<string>('RENDER_EXTERNAL_URL')
    ? '/api/auth/google'
    : '/auth/google';
}

export function sessionCookieOptions(
  configService: ConfigService,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(configService),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_IN_MS,
  };
}

export function oauthStateCookieOptions(
  configService: ConfigService,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(configService),
    sameSite: 'lax',
    path: oauthStatePath(configService),
    maxAge: STATE_MAX_AGE_IN_MS,
  };
}
