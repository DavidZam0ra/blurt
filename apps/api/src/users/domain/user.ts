export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  authTag: string;
}

export interface User {
  id: string;
  googleId: string;
  email: string;
  name?: string;
  pictureUrl?: string;
  googleRefreshTokenEncrypted: EncryptedPayload;
  googleCalendarId: string;
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
