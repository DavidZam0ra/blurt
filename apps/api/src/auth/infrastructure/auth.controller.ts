import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthenticateWithGoogleUseCase } from '../application/authenticate-with-google.use-case';
import { SessionTokenService } from '../application/session-token.service';
import {
  CALENDAR_SCOPES,
  GoogleOAuthClientFactory,
} from './google-oauth-client.factory';
import { AuthGuard, SESSION_COOKIE_NAME } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import {
  oauthStateCookieOptions,
  oauthStatePath,
  sessionCookieOptions,
} from './cookie-options';
import type { User } from '../../users/domain/user';

const OAUTH_STATE_COOKIE_NAME = 'blurt_oauth_state';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly googleOAuthClientFactory: GoogleOAuthClientFactory,
    private readonly authenticateWithGoogle: AuthenticateWithGoogleUseCase,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  @Get('google')
  google(@Res() res: Response): void {
    const state = randomBytes(16).toString('hex');
    const authUrl = this.googleOAuthClientFactory.create().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: CALENDAR_SCOPES,
      state,
    });

    res.cookie(
      OAUTH_STATE_COOKIE_NAME,
      state,
      oauthStateCookieOptions(this.configService),
    );
    res.redirect(authUrl);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const cookies = res.req.cookies as Record<string, string | undefined>;
    const expectedState = cookies[OAUTH_STATE_COOKIE_NAME];
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, {
      path: oauthStatePath(this.configService),
    });

    if (!code || !state || state !== expectedState) {
      throw new BadRequestException('Invalid OAuth state or missing code');
    }

    const user = await this.authenticateWithGoogle.execute(code);
    const sessionToken = this.sessionTokenService.sign(user.id);

    res.cookie(
      SESSION_COOKIE_NAME,
      sessionToken,
      sessionCookieOptions(this.configService),
    );
    res.redirect(this.configService.getOrThrow<string>('WEB_ORIGIN'));
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      pictureUrl: user.pictureUrl,
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Res() res: Response): void {
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.status(204).send();
  }
}
