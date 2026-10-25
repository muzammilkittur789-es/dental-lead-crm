import type { Clinic } from '../types/clinic';

const DB_NAME = 'DentalLeadCRM_DB';
const DB_VERSION = 1;
const STORE_NAME = 'clinics';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('city', 'city', { unique: false });
        store.createIndex('locality', 'locality', { unique: false });
        store.createIndex('websiteStatus', 'websiteStatus', { unique: false });
        store.createIndex('salesStatus', 'salesStatus', { unique: false });
        store.createIndex('followUpDate', 'followUpDate', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB database.'));
    };
  });

  return dbPromise;
}

export async function getAllClinics(): Promise<Clinic[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result as Clinic[]) || [];
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to fetch clinics from storage.'));
    };
  });
}

export async function getClinicById(id: string): Promise<Clinic | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as Clinic | undefined);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to fetch clinic with ID: ${id}`));
    };
  });
}

export async function saveClinic(clinic: Clinic): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(clinic);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to save clinic to storage.'));
    };
  });
}

export async function bulkSaveClinics(clinics: Clinic[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    clinics.forEach((clinic) => {
      store.put(clinic);
    });

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(tx.error || new Error('Failed to bulk save clinics.'));
    };
  });
}

export async function deleteClinic(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to delete clinic with ID: ${id}`));
    };
  });
}

export async function clearAllClinics(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to clear clinics database.'));
    };
  });
}

export async function getDatabaseStats(): Promise<{
  count: number;
  estimatedBytes: number;
  lastUpdated: string | null;
}> {
  const clinics = await getAllClinics();
  const count = clinics.length;
  const jsonStr = JSON.stringify(clinics);
  const estimatedBytes = new Blob([jsonStr]).size;

  let latestDate: string | null = null;
  if (clinics.length > 0) {
    const timestamps = clinics.map((c) => new Date(c.updatedAt || c.createdAt).getTime());
    const maxTime = Math.max(...timestamps);
    latestDate = new Date(maxTime).toISOString();
  }

  return {
    count,
    estimatedBytes,
    lastUpdated: latestDate,
  };
}

const LAST_BACKUP_KEY = 'dental_lead_crm_last_backup_time';

export function recordBackupTime(): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  } catch {
    // Ignore storage errors in restricted iframe
  }
}

export function getLastBackupTime(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}
