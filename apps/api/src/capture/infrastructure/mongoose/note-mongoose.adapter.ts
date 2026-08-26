import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateNoteInput,
  NoteRepositoryPort,
  UpdateNoteInput,
} from '../../domain/note-repository.port';
import { Note } from '../../domain/note';
import { NoteDocument, NoteEntity } from './note.schema';

@Injectable()
export class NoteMongooseAdapter implements NoteRepositoryPort {
  constructor(
    @InjectModel(NoteEntity.name)
    private readonly noteModel: Model<NoteDocument>,
  ) {}

  async create(input: CreateNoteInput): Promise<Note> {
    const document = await this.noteModel.create({
      userId: new Types.ObjectId(input.userId),
      candidateEvents: input.candidateEvents,
    });
    return this.toNote(document);
  }

  async findById(id: string, userId: string): Promise<Note | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const document = await this.noteModel
      .findOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    return document ? this.toNote(document) : null;
  }

  async listByUser(userId: string): Promise<Note[]> {
    const documents = await this.noteModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return documents.map((document) => this.toNote(document));
  }

  async update(
    id: string,
    userId: string,
    changes: UpdateNoteInput,
  ): Promise<Note> {
    const document = await this.noteModel
      .findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        changes,
        { new: true },
      )
      .exec();
    if (!document) {
      throw new NotFoundException('Note not found');
    }
    return this.toNote(document);
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.noteModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Note not found');
    }
  }

  private toNote(document: NoteDocument): Note {
    return {
      id: document.id,
      userId: document.userId.toString(),
      status: document.status,
      candidateEvents: document.candidateEvents,
      externalEventIds: document.externalEventIds,
      errorMessage: document.errorMessage,
      createdAt: (document as unknown as { createdAt: Date }).createdAt,
      updatedAt: (document as unknown as { updatedAt: Date }).updatedAt,
    };
  }
}
