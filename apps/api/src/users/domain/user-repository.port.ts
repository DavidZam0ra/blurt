import { GoogleProfile, User, UserPreferences } from './user';

export const USER_REPOSITORY_PORT = Symbol('UserRepositoryPort');

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  upsertFromGoogleProfile(profile: GoogleProfile): Promise<User>;
  updatePreferences(userId: string, preferences: UserPreferences): Promise<User>;
  updateGoogleCalendarId(userId: string, googleCalendarId: string): Promise<User>;
  delete(userId: string): Promise<void>;
}
