import { IsISO8601 } from 'class-validator';

export class ExtractEventRequestDto {
  @IsISO8601()
  referenceDateTime!: string;
}
