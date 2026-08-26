import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { CryptoModule } from '../shared/crypto/crypto.module';
import { AuthController } from './infrastructure/auth.controller';
import { AuthGuard } from './infrastructure/auth.guard';
import { GoogleOAuthClientFactory } from './infrastructure/google-oauth-client.factory';
import { AuthenticateWithGoogleUseCase } from './application/authenticate-with-google.use-case';
import { SessionTokenService } from './application/session-token.service';

@Module({
  imports: [UsersModule, CryptoModule],
  controllers: [AuthController],
  providers: [
    GoogleOAuthClientFactory,
    AuthenticateWithGoogleUseCase,
    SessionTokenService,
    AuthGuard,
  ],
  exports: [AuthGuard, SessionTokenService, UsersModule],
})
export class AuthModule {}
