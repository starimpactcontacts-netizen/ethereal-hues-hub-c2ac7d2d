/**
 * IndexedDB-based persistent video file storage for Loopgate Studio.
 * Stores full video File blobs keyed by project ID so users never
 * have to re-import between sessions.
 */

const DB_NAME = "loopgate_studio_files";
const DB_VERSION = 1;
const STORE_NAME = "video_files";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save a video File blob for a given project ID */
export async function saveVideoFile(projectId: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    // Store as a plain object so we can reconstruct the File later
    tx.objectStore(STORE_NAME).put(
      { blob: file, name: file.name, type: file.type, lastModified: file.lastModified },
      projectId
    );
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load a video File blob for a given project ID. Returns null if not found. */
export async function loadVideoFile(projectId: string): Promise<File | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(projectId);
      req.onsuccess = () => {
        const record = req.result;
        if (!record) { resolve(null); return; }
        // Reconstruct File from stored blob
        try {
          const file = new File([record.blob], record.name, {
            type: record.type,
            lastModified: record.lastModified,
          });
          resolve(file);
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/** Delete a stored video file */
export async function deleteVideoFile(projectId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // silent fail
  }
}

/** Check if a video file exists for a project */
export async function hasVideoFile(projectId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).count(IDBKeyRange.only(projectId));
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

/** Get approximate total storage used (in bytes) */
export async function getStorageUsage(): Promise<{ used: number; quota: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return { used: est.usage ?? 0, quota: est.quota ?? 0 };
  }
  return null;
}
