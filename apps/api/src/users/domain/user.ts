export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  authTag: string;
}

export interface UserPreferences {
  /** Reminder offsets (minutes before the event) applied to a new event unless the user picks otherwise. */
  defaultReminderOffsetsInMinutes: number[];
}

// 1 day + 1 hour before — the app's original hardcoded default, kept as the
// fallback for users who haven't saved preferences yet (existing accounts
// included, since this field didn't always exist on the User document).
export const DEFAULT_REMINDER_OFFSETS_IN_MINUTES = [24 * 60, 60];

export interface User {
  id: string;
  googleId: string;
  email: string;
  name?: string;
  pictureUrl?: string;
  googleRefreshTokenEncrypted: EncryptedPayload;
  googleCalendarId: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string;
  pictureUrl?: string;
  googleRefreshTokenEncrypted: EncryptedPayload;
}
