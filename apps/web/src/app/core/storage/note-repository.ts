import { Injectable } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { VoiceNote } from '../models/voice-note';

interface BlurtDbSchema extends DBSchema {
  notes: {
    key: string;
    value: VoiceNote;
    indexes: { createdAt: number };
  };
}

const DB_NAME = 'blurt';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';

@Injectable({ providedIn: 'root' })
export class NoteRepository {
  private readonly dbPromise: Promise<IDBPDatabase<BlurtDbSchema>>;

  constructor() {
    this.dbPromise = openDB<BlurtDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      },
    });
  }

  async save(note: VoiceNote): Promise<void> {
    const db = await this.dbPromise;
    await db.put(NOTES_STORE, note);
  }

  async list(): Promise<VoiceNote[]> {
    const db = await this.dbPromise;
    const notes = await db.getAllFromIndex(NOTES_STORE, 'createdAt');
    return notes.reverse();
  }

  async findById(id: string): Promise<VoiceNote | undefined> {
    const db = await this.dbPromise;
    return db.get(NOTES_STORE, id);
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(NOTES_STORE, id);
  }
}
