import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptedPayload } from '../../users/domain/user';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH_IN_BYTES = 32;
const IV_LENGTH_IN_BYTES = 12;

@Injectable()
export class TokenEncryptionService {
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    const key = Buffer.from(
      configService.getOrThrow<string>('TOKEN_ENCRYPTION_KEY'),
      'base64',
    );
    if (key.length !== KEY_LENGTH_IN_BYTES) {
      throw new Error(
        `TOKEN_ENCRYPTION_KEY must decode to ${KEY_LENGTH_IN_BYTES} bytes (got ${key.length})`,
      );
    }
    this.key = key;
  }

  encrypt(plaintext: string): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH_IN_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    return {
      iv: iv.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(payload.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
