import { Injectable } from '@nestjs/common';
import { TokenEncryptionService } from '../../shared/crypto/token-encryption.service';
import { User } from '../../users/domain/user';
import { GoogleCalendarCredentials } from '../domain/calendar.port';

@Injectable()
export class GoogleCredentialsResolver {
  constructor(private readonly tokenEncryption: TokenEncryptionService) {}

  resolve(user: User): GoogleCalendarCredentials {
    return {
      refreshToken: this.tokenEncryption.decrypt(
        user.googleRefreshTokenEncrypted,
      ),
      calendarId: user.googleCalendarId,
    };
  }
}
