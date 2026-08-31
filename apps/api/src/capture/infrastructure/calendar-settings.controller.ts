import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/infrastructure/auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import type { User } from '../../users/domain/user';
import { ListCalendarsUseCase } from '../application/list-calendars.use-case';
import { SelectCalendarUseCase } from '../application/select-calendar.use-case';
import { SelectCalendarRequestDto } from './dto/select-calendar-request.dto';
import { GoogleCalendarListEntry } from '../domain/calendar.port';

@UseGuards(AuthGuard)
@Controller('calendars')
export class CalendarSettingsController {
  constructor(
    private readonly listCalendars: ListCalendarsUseCase,
    private readonly selectCalendar: SelectCalendarUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: User): Promise<GoogleCalendarListEntry[]> {
    return this.listCalendars.execute(user);
  }

  @Patch('selection')
  async select(
    @CurrentUser() user: User,
    @Body() request: SelectCalendarRequestDto,
  ): Promise<{ googleCalendarId: string }> {
    const updated = await this.selectCalendar.execute(
      user,
      request.googleCalendarId,
    );
    return { googleCalendarId: updated.googleCalendarId };
  }
}
