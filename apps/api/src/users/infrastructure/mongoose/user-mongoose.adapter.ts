import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepositoryPort } from '../../domain/user-repository.port';
import { GoogleProfile, User } from '../../domain/user';
import { UserDocument, UserEntity } from './user.schema';

@Injectable()
export class UserMongooseAdapter implements UserRepositoryPort {
  constructor(
    @InjectModel(UserEntity.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const document = await this.userModel.findById(id).exec();
    return document ? this.toUser(document) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const document = await this.userModel.findOne({ googleId }).exec();
    return document ? this.toUser(document) : null;
  }

  async upsertFromGoogleProfile(profile: GoogleProfile): Promise<User> {
    const document = await this.userModel
      .findOneAndUpdate(
        { googleId: profile.googleId },
        {
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          pictureUrl: profile.pictureUrl,
          googleRefreshTokenEncrypted: profile.googleRefreshTokenEncrypted,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
    return this.toUser(document);
  }

  private toUser(document: UserDocument): User {
    return {
      id: document.id,
      googleId: document.googleId,
      email: document.email,
      name: document.name,
      pictureUrl: document.pictureUrl,
      googleRefreshTokenEncrypted: document.googleRefreshTokenEncrypted,
      googleCalendarId: document.googleCalendarId,
      createdAt: (document as unknown as { createdAt: Date }).createdAt,
      updatedAt: (document as unknown as { updatedAt: Date }).updatedAt,
    };
  }
}
