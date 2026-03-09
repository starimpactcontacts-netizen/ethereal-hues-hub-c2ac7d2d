/**
 * Loopgate Studio — Persistent Video File Storage
 * 
 * Uses a multi-layer approach to prevent the "re-select file" problem:
 * 1. Requests persistent storage so the browser never auto-evicts
 * 2. Primary: OPFS (Origin Private File System) — designed for large files, browser won't clear
 * 3. Fallback: IndexedDB — works everywhere but browser can evict under storage pressure
 */

const DB_NAME = "loopgate_studio_files";
const DB_VERSION = 1;
const STORE_NAME = "video_files";
const OPFS_DIR = "studio_videos";

// ─── Persistent Storage Request ───
let persistenceRequested = false;

async function requestPersistence(): Promise<boolean> {
  if (persistenceRequested) return true;
  persistenceRequested = true;
  
  try {
    if (navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      if (granted) {
        console.log("[Studio] Persistent storage granted — files won't be evicted");
      } else {
        console.warn("[Studio] Persistent storage denied — files may be evicted by browser");
      }
      return granted;
    }
  } catch (err) {
    console.warn("[Studio] Could not request persistent storage:", err);
  }
  return false;
}

// ─── OPFS (Origin Private File System) — Primary ───

async function getOPFSDir(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (!('getDirectory' in navigator.storage)) return null;
    const root = await navigator.storage.getDirectory();
    return await root.getDirectoryHandle(OPFS_DIR, { create: true });
  } catch {
    return null;
  }
}

async function saveToOPFS(projectId: string, file: File): Promise<boolean> {
  try {
    const dir = await getOPFSDir();
    if (!dir) return false;
    
    const fileHandle = await dir.getFileHandle(projectId, { create: true });
    
    // Use createWritable for efficient writing of large files
    if ('createWritable' in fileHandle) {
      const writable = await (fileHandle as any).createWritable();
      await writable.write(file);
      await writable.close();
    } else {
      // Fallback: createSyncAccessHandle not available in main thread
      return false;
    }

    // Also store metadata separately
    const metaHandle = await dir.getFileHandle(`${projectId}.meta`, { create: true });
    const metaWritable = await (metaHandle as any).createWritable();
    await metaWritable.write(JSON.stringify({
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    }));
    await metaWritable.close();
    
    console.log(`[Studio] Saved to OPFS: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    return true;
  } catch (err) {
    console.warn("[Studio] OPFS save failed:", err);
    return false;
  }
}

async function loadFromOPFS(projectId: string): Promise<File | null> {
  try {
    const dir = await getOPFSDir();
    if (!dir) return null;
    
    const fileHandle = await dir.getFileHandle(projectId);
    const metaHandle = await dir.getFileHandle(`${projectId}.meta`);
    
    const blob = await fileHandle.getFile();
    const metaBlob = await metaHandle.getFile();
    const meta = JSON.parse(await metaBlob.text());
    
    // Reconstruct as File with original name/type
    const file = new File([blob], meta.name || 'video.mp4', {
      type: meta.type || 'video/mp4',
      lastModified: meta.lastModified || Date.now(),
    });
    
    console.log(`[Studio] Loaded from OPFS: ${file.name}`);
    return file;
  } catch {
    return null;
  }
}

async function deleteFromOPFS(projectId: string): Promise<void> {
  try {
    const dir = await getOPFSDir();
    if (!dir) return;
    
    try { await dir.removeEntry(projectId); } catch {}
    try { await dir.removeEntry(`${projectId}.meta`); } catch {}
  } catch {}
}

async function existsInOPFS(projectId: string): Promise<boolean> {
  try {
    const dir = await getOPFSDir();
    if (!dir) return false;
    await dir.getFileHandle(projectId);
    return true;
  } catch {
    return false;
  }
}

// ─── IndexedDB — Fallback ───

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

async function saveToIDB(projectId: string, file: File): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(
        { blob: file, name: file.name, type: file.type, lastModified: file.lastModified },
        projectId
      );
      tx.oncomplete = () => { console.log(`[Studio] Saved to IndexedDB: ${file.name}`); resolve(true); };
      tx.onerror = () => { console.warn("[Studio] IndexedDB save failed"); resolve(false); };
    });
  } catch {
    return false;
  }
}

async function loadFromIDB(projectId: string): Promise<File | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(projectId);
      req.onsuccess = () => {
        const record = req.result;
        if (!record) { resolve(null); return; }
        try {
          const file = new File([record.blob], record.name, {
            type: record.type,
            lastModified: record.lastModified,
          });
          console.log(`[Studio] Loaded from IndexedDB: ${file.name}`);
          resolve(file);
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function deleteFromIDB(projectId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

// ─── Public API (multi-layer) ───

/** Save a video File blob for a given project ID */
export async function saveVideoFile(projectId: string, file: File): Promise<void> {
  // Request persistent storage first
  await requestPersistence();
  
  // Try OPFS first (most reliable for large files), then IDB as backup
  const opfsOk = await saveToOPFS(projectId, file);
  const idbOk = await saveToIDB(projectId, file);
  
  if (!opfsOk && !idbOk) {
    console.error("[Studio] Failed to save video to any storage layer!");
  }
}

/** Load a video File blob for a given project ID. Returns null if not found. */
export async function loadVideoFile(projectId: string): Promise<File | null> {
  // Try OPFS first
  const opfsFile = await loadFromOPFS(projectId);
  if (opfsFile) return opfsFile;
  
  // Fallback to IndexedDB
  const idbFile = await loadFromIDB(projectId);
  if (idbFile) {
    // Migrate to OPFS for next time
    saveToOPFS(projectId, idbFile).catch(() => {});
    return idbFile;
  }
  
  return null;
}

/** Delete a stored video file */
export async function deleteVideoFile(projectId: string): Promise<void> {
  await Promise.all([
    deleteFromOPFS(projectId),
    deleteFromIDB(projectId),
  ]);
}

/** Check if a video file exists for a project */
export async function hasVideoFile(projectId: string): Promise<boolean> {
  if (await existsInOPFS(projectId)) return true;
  
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).count(IDBKeyRange.only(projectId));
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/** Get approximate total storage used (in bytes) */
export async function getStorageUsage(): Promise<{ used: number; quota: number; persistent: boolean } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    let persistent = false;
    try {
      if (navigator.storage.persisted) {
        persistent = await navigator.storage.persisted();
      }
    } catch {}
    return { used: est.usage ?? 0, quota: est.quota ?? 0, persistent };
  }
  return null;
}
