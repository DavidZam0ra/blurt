import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/infrastructure/auth.guard';
import { CurrentUser } from '../../auth/infrastructure/current-user.decorator';
import type { User } from '../../users/domain/user';
import { ListNotesUseCase } from '../application/list-notes.use-case';
import { GetNoteUseCase } from '../application/get-note.use-case';
import { ConfirmNoteUseCase } from '../application/confirm-note.use-case';
import { UndoNoteUseCase } from '../application/undo-note.use-case';
import { DeleteNoteUseCase } from '../application/delete-note.use-case';
import { RemoveEventFromNoteUseCase } from '../application/remove-event-from-note.use-case';
import { UpdateEventInNoteUseCase } from '../application/update-event-in-note.use-case';
import { ConfirmNoteRequestDto } from './dto/confirm-note-request.dto';
import { ExtractedEventDto } from './dto/extracted-event.dto';
import { Note } from '../domain/note';

@UseGuards(AuthGuard)
@Controller('notes')
export class NotesController {
  constructor(
    private readonly listNotes: ListNotesUseCase,
    private readonly getNote: GetNoteUseCase,
    private readonly confirmNote: ConfirmNoteUseCase,
    private readonly undoNote: UndoNoteUseCase,
    private readonly deleteNote: DeleteNoteUseCase,
    private readonly removeEventFromNote: RemoveEventFromNoteUseCase,
    private readonly updateEventInNote: UpdateEventInNoteUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: User): Promise<Note[]> {
    return this.listNotes.execute(user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: User): Promise<Note> {
    return this.getNote.execute(id, user.id);
  }

  @Post(':id/confirm')
  confirm(
    @Param('id') id: string,
    @Body() request: ConfirmNoteRequestDto,
    @CurrentUser() user: User,
  ): Promise<Note> {
    return this.confirmNote.execute(id, user, request.events);
  }

  @Post(':id/undo')
  undo(@Param('id') id: string, @CurrentUser() user: User): Promise<Note> {
    return this.undoNote.execute(id, user);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    return this.deleteNote.execute(id, user);
  }

  @Delete(':id/events/:index')
  removeEvent(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
    @CurrentUser() user: User,
  ): Promise<Note | null> {
    return this.removeEventFromNote.execute(id, user, index);
  }

  @Patch(':id/events/:index')
  updateEvent(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
    @Body() event: ExtractedEventDto,
    @CurrentUser() user: User,
  ): Promise<Note> {
    return this.updateEventInNote.execute(id, user, index, event);
  }
}
