import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class ExtractEventRequestDto {
  @IsISO8601()
  referenceDateTime!: string;

  @IsOptional()
  @IsString()
  timeZone?: string;
}
