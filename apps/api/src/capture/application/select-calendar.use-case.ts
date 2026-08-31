import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY_PORT } from '../../users/domain/user-repository.port';
import type { UserRepositoryPort } from '../../users/domain/user-repository.port';
import { User } from '../../users/domain/user';

@Injectable()
export class SelectCalendarUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  execute(user: User, googleCalendarId: string): Promise<User> {
    return this.userRepository.updateGoogleCalendarId(user.id, googleCalendarId);
  }
}
