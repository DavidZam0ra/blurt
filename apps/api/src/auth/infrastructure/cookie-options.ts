import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';

const SESSION_MAX_AGE_IN_MS = 30 * 24 * 60 * 60 * 1000;
const STATE_MAX_AGE_IN_MS = 5 * 60 * 1000;

function isProduction(configService: ConfigService): boolean {
  return configService.get<string>('NODE_ENV') === 'production';
}

export function sessionCookieOptions(
  configService: ConfigService,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction(configService),
    // Same-origin everywhere now (blurt-api serves the Angular build too —
    // see ServeStaticModule in app.module.ts), so Lax is enough; no need
    // for None, which Safari ITP and Chrome Incognito treat as a
    // third-party cookie and drop.
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
    path: '/auth/google',
    maxAge: STATE_MAX_AGE_IN_MS,
  };
}
