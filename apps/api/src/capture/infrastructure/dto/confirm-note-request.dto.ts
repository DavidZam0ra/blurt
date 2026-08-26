import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ExtractedEventDto } from './extracted-event.dto';

export class ConfirmNoteRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExtractedEventDto)
  events!: ExtractedEventDto[];
}
