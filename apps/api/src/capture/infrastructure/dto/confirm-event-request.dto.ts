import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsISO8601, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ExtractedEvent } from '../../domain/extracted-event';
import { EVENT_CATEGORIES } from '../../domain/event-category';
import type { EventCategory } from '../../domain/event-category';

class ExtractedEventDto implements ExtractedEvent {
  @IsString()
  title!: string;

  @IsISO8601()
  startDateTime!: string;

  @IsArray()
  @IsNumber({}, { each: true })
  reminderOffsetsInMinutes!: number[];

  @IsBoolean()
  isAmbiguous!: boolean;

  @IsIn(EVENT_CATEGORIES)
  category!: EventCategory;
}

export class ConfirmEventRequestDto {
  @ValidateNested()
  @Type(() => ExtractedEventDto)
  event!: ExtractedEventDto;

  @IsOptional()
  @IsString()
  calendarId?: string;
}
