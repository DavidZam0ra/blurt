import { GoogleProfile, User } from './user';

export const USER_REPOSITORY_PORT = Symbol('UserRepositoryPort');

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  upsertFromGoogleProfile(profile: GoogleProfile): Promise<User>;
}
