import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Event } from '../types/event';
import { Participant } from '../types/participant';
import { CertificateFile } from '../types/certificate';
import { GasSettings, SendingLogEntry } from '../types/api';

interface MailerDBSchema extends DBSchema {
  events: {
    key: string;
    value: Event;
  };
  participants: {
    key: string;
    value: Participant;
    indexes: {
      'by-event': string;
      'by-status': string;
    };
  };
  certificates: {
    key: string;
    value: CertificateFile;
    indexes: {
      'by-event': string;
    };
  };
  logs: {
    key: string;
    value: SendingLogEntry;
    indexes: {
      'by-event': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'CertificateMailerDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MailerDBSchema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MailerDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Events Store
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }

        // Participants Store
        if (!db.objectStoreNames.contains('participants')) {
          const pStore = db.createObjectStore('participants', { keyPath: 'id' });
          pStore.createIndex('by-event', 'eventId');
          pStore.createIndex('by-status', 'status');
        }

        // Certificates Store
        if (!db.objectStoreNames.contains('certificates')) {
          const cStore = db.createObjectStore('certificates', { keyPath: 'id' });
          cStore.createIndex('by-event', 'eventId');
        }

        // Logs Store
        if (!db.objectStoreNames.contains('logs')) {
          const lStore = db.createObjectStore('logs', { keyPath: 'id' });
          lStore.createIndex('by-event', 'eventId');
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// ----------------------------------------------------
// EVENT CRUD
// ----------------------------------------------------
export async function getAllEvents(): Promise<Event[]> {
  const db = await getDB();
  return db.getAll('events');
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const db = await getDB();
  return db.get('events', id);
}

export async function saveEvent(event: Event): Promise<void> {
  const db = await getDB();
  await db.put('events', event);
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['events', 'participants', 'certificates', 'logs'], 'readwrite');
  
  await tx.objectStore('events').delete(id);
  
  // Delete all associated participants
  const pIndex = tx.objectStore('participants').index('by-event');
  let pKeys = await pIndex.getAllKeys(id);
  for (const key of pKeys) {
    await tx.objectStore('participants').delete(key);
  }

  // Delete all associated certificates
  const cIndex = tx.objectStore('certificates').index('by-event');
  let cKeys = await cIndex.getAllKeys(id);
  for (const key of cKeys) {
    await tx.objectStore('certificates').delete(key);
  }

  await tx.done;
}

// ----------------------------------------------------
// PARTICIPANT CRUD
// ----------------------------------------------------
export async function getParticipantsByEvent(eventId: string): Promise<Participant[]> {
  const db = await getDB();
  return db.getAllFromIndex('participants', 'by-event', eventId);
}

export async function saveParticipants(participants: Participant[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('participants', 'readwrite');
  for (const p of participants) {
    await tx.store.put(p);
  }
  await tx.done;
}

export async function saveParticipant(participant: Participant): Promise<void> {
  const db = await getDB();
  await db.put('participants', participant);
}

export async function deleteParticipant(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('participants', id);
}

export async function clearEventParticipants(eventId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('participants', 'readwrite');
  const index = tx.store.index('by-event');
  const keys = await index.getAllKeys(eventId);
  for (const key of keys) {
    await tx.store.delete(key);
  }
  await tx.done;
}

// ----------------------------------------------------
// CERTIFICATE FILES CRUD
// ----------------------------------------------------
export async function getCertificatesByEvent(eventId: string): Promise<CertificateFile[]> {
  const db = await getDB();
  return db.getAllFromIndex('certificates', 'by-event', eventId);
}

export async function saveCertificateFile(cert: CertificateFile): Promise<void> {
  const db = await getDB();
  await db.put('certificates', cert);
}

export async function saveCertificateFiles(certs: CertificateFile[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('certificates', 'readwrite');
  for (const c of certs) {
    await tx.store.put(c);
  }
  await tx.done;
}

export async function deleteCertificateFile(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('certificates', id);
}

export async function clearEventCertificates(eventId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('certificates', 'readwrite');
  const index = tx.store.index('by-event');
  const keys = await index.getAllKeys(eventId);
  for (const key of keys) {
    await tx.store.delete(key);
  }
  await tx.done;
}

// ----------------------------------------------------
// LOGS & SETTINGS
// ----------------------------------------------------
export async function getLogsByEvent(eventId: string): Promise<SendingLogEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('logs', 'by-event', eventId);
}

export async function addLogEntry(entry: SendingLogEntry): Promise<void> {
  const db = await getDB();
  await db.put('logs', entry);
}

export async function getGasSettings(): Promise<GasSettings> {
  const db = await getDB();
  const val = await db.get('settings', 'gas_config');
  return val || {
    webAppUrl: '',
    connected: false,
    remainingQuota: 100,
    batchDelayMs: 1200,
  };
}

export async function saveGasSettings(settings: GasSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'gas_config');
}
