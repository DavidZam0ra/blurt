import { IsString, MinLength } from 'class-validator';

export class SelectCalendarRequestDto {
  @IsString()
  @MinLength(1)
  googleCalendarId!: string;
}
