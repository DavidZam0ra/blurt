import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { EncryptedPayload } from '../../domain/user';

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
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
