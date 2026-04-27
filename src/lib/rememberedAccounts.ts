export interface RememberedAccount {
  username: string;
  email: string; // real or placeholder used for supabase signIn
  avatarUrl?: string | null;
  lastUsedAt: number;
}

const KEY = 'loopgate_remembered_accounts';
const MAX = 4;

export function getRememberedAccounts(): RememberedAccount[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a) => a && typeof a.username === 'string' && typeof a.email === 'string')
      .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function rememberAccount(acc: { username: string; email: string; avatarUrl?: string | null }) {
  try {
    const existing = getRememberedAccounts().filter(
      (a) => a.email.toLowerCase() !== acc.email.toLowerCase(),
    );
    const next: RememberedAccount[] = [
      { ...acc, lastUsedAt: Date.now() },
      ...existing,
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function forgetAccount(email: string) {
  try {
    const next = getRememberedAccounts().filter(
      (a) => a.email.toLowerCase() !== email.toLowerCase(),
    );
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}