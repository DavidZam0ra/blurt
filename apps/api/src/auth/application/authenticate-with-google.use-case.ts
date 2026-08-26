import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_PORT } from '../../users/domain/user-repository.port';
import type { UserRepositoryPort } from '../../users/domain/user-repository.port';
import { User } from '../../users/domain/user';
import { TokenEncryptionService } from '../../shared/crypto/token-encryption.service';
import { GoogleOAuthClientFactory } from '../infrastructure/google-oauth-client.factory';

@Injectable()
export class AuthenticateWithGoogleUseCase {
  constructor(
    private readonly googleOAuthClientFactory: GoogleOAuthClientFactory,
    private readonly tokenEncryption: TokenEncryptionService,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(authorizationCode: string): Promise<User> {
    const oauth2Client = this.googleOAuthClientFactory.create();
    const { tokens } = await oauth2Client.getToken(authorizationCode);

    if (!tokens.refresh_token) {
      throw new Error(
        'Google did not return a refresh token — the consent prompt may not have been shown',
      );
    }
    if (!tokens.id_token) {
      throw new Error('Google did not return an id_token');
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.googleOAuthClientFactory.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error('Google id_token payload is missing sub/email');
    }

    return this.userRepository.upsertFromGoogleProfile({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      pictureUrl: payload.picture,
      googleRefreshTokenEncrypted: this.tokenEncryption.encrypt(
        tokens.refresh_token,
      ),
    });
  }
}
