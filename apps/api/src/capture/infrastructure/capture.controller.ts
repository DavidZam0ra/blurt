import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtractEventFromAudioUseCase } from '../application/extract-event-from-audio.use-case';
import { ConfirmEventUseCase } from '../application/confirm-event.use-case';
import { UndoCalendarEventUseCase } from '../application/undo-calendar-event.use-case';
import { ExtractedEvent } from '../domain/extracted-event';
import { ExtractEventRequestDto } from './dto/extract-event-request.dto';
import { ConfirmEventRequestDto } from './dto/confirm-event-request.dto';
import 'multer';

const DEFAULT_CALENDAR_ID = 'primary';
const DEFAULT_TIME_ZONE = 'UTC';

@Controller('capture')
export class CaptureController {
  constructor(
    private readonly extractEventFromAudio: ExtractEventFromAudioUseCase,
    private readonly confirmEvent: ConfirmEventUseCase,
    private readonly undoCalendarEvent: UndoCalendarEventUseCase,
  ) {}

  @Post('extract')
  @UseInterceptors(FileInterceptor('audio'))
  async extract(
    @UploadedFile() audio: Express.Multer.File,
    @Body() request: ExtractEventRequestDto,
  ): Promise<ExtractedEvent[]> {
    return this.extractEventFromAudio.execute(
      audio.buffer,
      audio.originalname,
      new Date(request.referenceDateTime),
      request.timeZone ?? DEFAULT_TIME_ZONE,
    );
  }

  @Post('confirm')
  async confirm(
    @Body() request: ConfirmEventRequestDto,
  ): Promise<{ externalEventId: string }> {
    const externalEventId = await this.confirmEvent.execute(
      request.event,
      request.calendarId ?? DEFAULT_CALENDAR_ID,
    );
    return { externalEventId };
  }

  @Delete('events/:externalEventId')
  async undo(@Param('externalEventId') externalEventId: string): Promise<void> {
    return this.undoCalendarEvent.execute(externalEventId);
  }
}
