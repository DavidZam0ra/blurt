import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  DEFAULT_REMINDER_OFFSETS_IN_MINUTES,
  type EncryptedPayload,
  type UserPreferences,
} from '../../domain/user';

export type UserDocument = HydratedDocument<UserEntity>;

@Schema({ _id: false })
class EncryptedPayloadSchema implements EncryptedPayload {
  @Prop({ required: true })
  iv!: string;

  @Prop({ required: true })
  ciphertext!: string;

  @Prop({ required: true })
  authTag!: string;
}

@Schema({ _id: false })
class UserPreferencesSchema implements UserPreferences {
  @Prop({ type: [Number], default: DEFAULT_REMINDER_OFFSETS_IN_MINUTES })
  defaultReminderOffsetsInMinutes!: number[];
}

@Schema({ collection: 'users', timestamps: true })
export class UserEntity {
  @Prop({ required: true, unique: true })
  googleId!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop()
  name?: string;

  @Prop()
  pictureUrl?: string;

  @Prop({ required: true, type: EncryptedPayloadSchema })
  googleRefreshTokenEncrypted!: EncryptedPayload;

  @Prop({ required: true, default: 'primary' })
  googleCalendarId!: string;

  @Prop({ type: UserPreferencesSchema })
  preferences?: UserPreferences;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
