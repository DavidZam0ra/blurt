import { ArrayMaxSize, IsArray, IsInt, Min } from 'class-validator';
import { UserPreferences } from '../../domain/user';

export class UpdateUserPreferencesDto implements UserPreferences {
  @IsArray()
  @ArrayMaxSize(5) // Google Calendar allows at most 5 reminder overrides per event.
  @IsInt({ each: true })
  @Min(0, { each: true })
  defaultReminderOffsetsInMinutes!: number[];
}
