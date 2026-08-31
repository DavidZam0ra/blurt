import { ArrayMaxSize, IsArray, IsInt, Max, Min } from 'class-validator';
import { UserPreferences } from '../../domain/user';

// Google Calendar's own limits: at most 5 reminder overrides per event, each
// between 0 and 4 weeks (40320 minutes) before the event.
const MAX_REMINDER_COUNT = 5;
const MAX_REMINDER_OFFSET_IN_MINUTES = 40320;

export class UpdateUserPreferencesDto implements UserPreferences {
  @IsArray()
  @ArrayMaxSize(MAX_REMINDER_COUNT)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(MAX_REMINDER_OFFSET_IN_MINUTES, { each: true })
  defaultReminderOffsetsInMinutes!: number[];
}
