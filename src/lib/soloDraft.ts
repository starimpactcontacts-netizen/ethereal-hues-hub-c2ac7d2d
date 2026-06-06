export type SoloDraft = {
  timer: 30 | 60 | 180 | null;
  startedAt: string | null;
  song: any | null;
  scenepack: any | null;
  videoUrl: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'bunny';
  title: string;
  caption: string;
  startOffset: number;
  mode: 'upload' | 'link';
  updatedAt: string;
};

const KEY = (userId: string) => `solo_share_draft_${userId}`;
const ACTIVE_KEY = 'solo_share_active_draft';

export function loadSoloDraft(userId: string | null | undefined): SoloDraft | null {
  if (!userId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (!raw) return null;
    return JSON.parse(raw) as SoloDraft;
  } catch {
    return null;
  }
}

export function saveSoloDraft(userId: string | null | undefined, draft: Partial<SoloDraft>) {
  if (!userId || typeof window === 'undefined') return;
  try {
    const prev = loadSoloDraft(userId) || {};
    const next = { ...prev, ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY(userId), JSON.stringify(next));
  } catch {}
}

export function clearSoloDraft(userId: string | null | undefined) {
  if (!userId || typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY(userId)); } catch {}
}

export function loadActiveSoloDraft(): SoloDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SoloDraft;
  } catch {
    return null;
  }
}

export function saveActiveSoloDraft(draft: Partial<SoloDraft>) {
  if (typeof window === 'undefined') return;
  try {
    const prev = loadActiveSoloDraft() || {};
    const next = { ...prev, ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(next));
  } catch {}
}

export function clearActiveSoloDraft() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(ACTIVE_KEY); } catch {}
}

/** A draft is "live" if it has at least a started timer or some user content. */
export function isLiveDraft(d: SoloDraft | null): boolean {
  if (!d) return false;
  return !!(d.startedAt || d.videoUrl || d.song || d.scenepack || d.title || d.caption);
}