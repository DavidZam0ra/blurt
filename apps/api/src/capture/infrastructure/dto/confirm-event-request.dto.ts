import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsISO8601, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ExtractedEvent } from '../../domain/extracted-event';

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
}

export class ConfirmEventRequestDto {
  @ValidateNested()
  @Type(() => ExtractedEventDto)
  event!: ExtractedEventDto;

  @IsOptional()
  @IsString()
  calendarId?: string;
}
