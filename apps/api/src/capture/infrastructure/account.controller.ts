import { Controller, Delete, HttpCode, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../../auth/infrastructure/auth.guard';
import { SESSION_COOKIE_NAME } from '../../auth/infrastructure/auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import type { User } from '../../users/domain/user';
import { DeleteAccountUseCase } from '../application/delete-account.use-case';

@UseGuards(AuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly deleteAccount: DeleteAccountUseCase) {}

  @Delete()
  @HttpCode(204)
  async delete(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    await this.deleteAccount.execute(user);
    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.status(204).send();
  }
}
