import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionTokenService } from '../application/session-token.service';
import { USER_REPOSITORY_PORT } from '../../users/domain/user-repository.port';
import type { UserRepositoryPort } from '../../users/domain/user-repository.port';

export const SESSION_COOKIE_NAME = 'blurt_session';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessionTokenService: SessionTokenService,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token: unknown = request.cookies?.[SESSION_COOKIE_NAME];

    if (typeof token !== 'string') {
      throw new UnauthorizedException('Not signed in');
    }

    const userId = this.sessionTokenService.verify(token);
    if (!userId) {
      throw new UnauthorizedException('Session expired or invalid');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    (request as Request & { user: typeof user }).user = user;
    return true;
  }
}
