import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SESSION_TTL_IN_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionPayload {
  sub: string;
  exp: number;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

@Injectable()
export class SessionTokenService {
  private readonly secret: string;

  constructor(configService: ConfigService) {
    this.secret = configService.getOrThrow<string>('SESSION_SECRET');
  }

  sign(userId: string): string {
    const payload: SessionPayload = {
      sub: userId,
      exp: Date.now() + SESSION_TTL_IN_MS,
    };
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = this.hmac(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verify(token: string): string | null {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = this.hmac(encodedPayload);
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      return null;
    }

    const payload = JSON.parse(
      base64UrlDecode(encodedPayload),
    ) as SessionPayload;
    if (payload.exp < Date.now()) {
      return null;
    }

    return payload.sub;
  }

  private hmac(encodedPayload: string): string {
    return createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');
  }
}
