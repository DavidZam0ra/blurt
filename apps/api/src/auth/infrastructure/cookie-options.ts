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
  const production = isProduction(configService);
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_IN_MS,
  };
}

export function oauthStateCookieOptions(
  configService: ConfigService,
): CookieOptions {
  const production = isProduction(configService);
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/auth/google',
    maxAge: STATE_MAX_AGE_IN_MS,
  };
}
