import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../auth/infrastructure/auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import type { User } from '../../users/domain/user';
import { ExtractEventFromAudioUseCase } from '../application/extract-event-from-audio.use-case';
import { CreateNoteUseCase } from '../application/create-note.use-case';
import { ExtractEventRequestDto } from './dto/extract-event-request.dto';
import { ExtractedEvent } from '../domain/extracted-event';
import 'multer';

const DEFAULT_TIME_ZONE = 'UTC';

@UseGuards(AuthGuard)
@Controller('capture')
export class CaptureController {
  constructor(
    private readonly extractEventFromAudio: ExtractEventFromAudioUseCase,
    private readonly createNote: CreateNoteUseCase,
  ) {}

  @Post('extract')
  @UseInterceptors(FileInterceptor('audio'))
  async extract(
    @UploadedFile() audio: Express.Multer.File,
    @Body() request: ExtractEventRequestDto,
    @CurrentUser() user: User,
  ): Promise<{ noteId: string; events: ExtractedEvent[] }> {
    const events = await this.extractEventFromAudio.execute(
      audio.buffer,
      audio.originalname,
      new Date(request.referenceDateTime),
      request.timeZone ?? DEFAULT_TIME_ZONE,
      user.preferences.defaultReminderOffsetsInMinutes,
    );
    const note = await this.createNote.execute(user.id, events);
    return { noteId: note.id, events };
  }
}
