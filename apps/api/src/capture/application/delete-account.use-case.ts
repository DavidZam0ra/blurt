import { Inject, Injectable, Logger } from '@nestjs/common';
import { NOTE_REPOSITORY_PORT } from '../domain/note-repository.port';
import type { NoteRepositoryPort } from '../domain/note-repository.port';
import { USER_REPOSITORY_PORT } from '../../users/domain/user-repository.port';
import type { UserRepositoryPort } from '../../users/domain/user-repository.port';
import { User } from '../../users/domain/user';
import { TokenEncryptionService } from '../../shared/crypto/token-encryption.service';
import { GoogleOAuthClientFactory } from '../../auth/infrastructure/google-oauth-client.factory';

@Injectable()
export class DeleteAccountUseCase {
  private readonly logger = new Logger(DeleteAccountUseCase.name);

  constructor(
    @Inject(NOTE_REPOSITORY_PORT)
    private readonly noteRepository: NoteRepositoryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenEncryption: TokenEncryptionService,
    private readonly googleOAuthClientFactory: GoogleOAuthClientFactory,
  ) {}

  /**
   * Deletes everything Blurt stored for this user (notes, preferences, the
   * account itself) and revokes the Google OAuth grant so the app no longer
   * has standing access. Deliberately does NOT delete events already synced
   * to the user's Google Calendar — those are their calendar entries now,
   * independent of Blurt, not something "delete my account" implies erasing.
   */
  async execute(user: User): Promise<void> {
    await this.noteRepository.deleteAllByUser(user.id);

    try {
      const refreshToken = this.tokenEncryption.decrypt(
        user.googleRefreshTokenEncrypted,
      );
      await this.googleOAuthClientFactory.create().revokeToken(refreshToken);
    } catch (error) {
      this.logger.warn(
        `revokeToken failed while deleting account ${user.id}, proceeding anyway: ${String(error)}`,
      );
    }

    await this.userRepository.delete(user.id);
  }
}
