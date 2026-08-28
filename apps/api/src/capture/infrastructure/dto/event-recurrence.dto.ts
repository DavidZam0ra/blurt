import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { RECURRENCE_FREQUENCIES } from '../../domain/event-recurrence';
import type { EventRecurrence } from '../../domain/event-recurrence';

export class EventRecurrenceDto implements EventRecurrence {
  @IsIn(RECURRENCE_FREQUENCIES)
  frequency!: EventRecurrence['frequency'];

  @IsOptional()
  @IsInt()
  interval?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  byDayOfWeek?: number[];

  @IsOptional()
  @IsInt()
  count?: number;

  @IsOptional()
  @IsString()
  until?: string;
}
