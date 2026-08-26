import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_REPOSITORY_PORT } from './domain/user-repository.port';
import { UserEntity, UserSchema } from './infrastructure/mongoose/user.schema';
import { UserMongooseAdapter } from './infrastructure/mongoose/user-mongoose.adapter';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserEntity.name, schema: UserSchema }]),
  ],
  providers: [{ provide: USER_REPOSITORY_PORT, useClass: UserMongooseAdapter }],
  exports: [USER_REPOSITORY_PORT],
})
export class UsersModule {}
