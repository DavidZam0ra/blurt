import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ExtractedEvent } from '../../domain/extracted-event';
import { EVENT_CATEGORIES } from '../../domain/event-category';
import type { NoteStatus } from '../../domain/note';

export type NoteDocument = HydratedDocument<NoteEntity>;

const NOTE_STATUSES: NoteStatus[] = ['AwaitingConfirmation', 'Synced', 'Error'];

@Schema({ _id: false })
class ExtractedEventSchema implements ExtractedEvent {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  startDateTime!: string;

  @Prop({ type: [Number], default: [] })
  reminderOffsetsInMinutes!: number[];

  @Prop({ required: true })
  isAmbiguous!: boolean;

  @Prop({ required: true, type: String, enum: EVENT_CATEGORIES })
  category!: ExtractedEvent['category'];
}

@Schema({ collection: 'notes', timestamps: true })
export class NoteEntity {
  @Prop({ required: true, type: Types.ObjectId, index: true })
  userId!: Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    enum: NOTE_STATUSES,
    default: 'AwaitingConfirmation',
  })
  status!: NoteStatus;

  @Prop({ type: [ExtractedEventSchema], default: [] })
  candidateEvents!: ExtractedEvent[];

  @Prop({ type: [String], default: [] })
  externalEventIds!: string[];

  @Prop()
  errorMessage?: string;
}

export const NoteSchema = SchemaFactory.createForClass(NoteEntity);
