import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExtractedEvent } from '../../domain/extracted-event';
import { EVENT_CATEGORIES } from '../../domain/event-category';
import type { EventCategory } from '../../domain/event-category';
import type { EventRecurrence } from '../../domain/event-recurrence';
import { EventRecurrenceDto } from './event-recurrence.dto';

export class ExtractedEventDto implements ExtractedEvent {
  @IsString()
  title!: string;

  @IsISO8601()
  startDateTime!: string;

  @IsOptional()
  @IsNumber()
  durationInMinutes?: number;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  reminderOffsetsInMinutes!: number[];

  @IsBoolean()
  isAmbiguous!: boolean;

  @IsIn(EVENT_CATEGORIES)
  category!: EventCategory;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventRecurrenceDto)
  recurrence?: EventRecurrence;

  @IsOptional()
  @IsString()
  timeZone?: string;
}
