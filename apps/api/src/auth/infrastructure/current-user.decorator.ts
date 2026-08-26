import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../users/domain/user';

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): User => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();
    return request.user;
  },
);
