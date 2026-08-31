import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ExtractedEvent } from '../../domain/extracted-event';
import { EVENT_CATEGORIES } from '../../domain/event-category';
import { RECURRENCE_FREQUENCIES } from '../../domain/event-recurrence';
import type { EventRecurrence } from '../../domain/event-recurrence';
import type { NoteStatus } from '../../domain/note';

export type NoteDocument = HydratedDocument<NoteEntity>;

const NOTE_STATUSES: NoteStatus[] = ['AwaitingConfirmation', 'Synced', 'Error'];

@Schema({ _id: false })
class EventRecurrenceSchema implements EventRecurrence {
  @Prop({ required: true, type: String, enum: RECURRENCE_FREQUENCIES })
  frequency!: EventRecurrence['frequency'];

  @Prop()
  interval?: number;

  @Prop({ type: [Number] })
  byDayOfWeek?: number[];

  @Prop()
  count?: number;

  @Prop()
  until?: string;
}

@Schema({ _id: false })
class ExtractedEventSchema implements ExtractedEvent {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  startDateTime!: string;

  @Prop()
  durationInMinutes?: number;

  @Prop({ type: [Number], default: [] })
  reminderOffsetsInMinutes!: number[];

  @Prop({ required: true })
  isAmbiguous!: boolean;

  @Prop({ required: true, type: String, enum: EVENT_CATEGORIES })
  category!: ExtractedEvent['category'];

  @Prop({ type: EventRecurrenceSchema, required: false })
  recurrence?: EventRecurrence;

  @Prop()
  timeZone?: string;
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
