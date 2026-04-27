export interface RememberedAccount {
  username: string;
  email: string; // real or placeholder used for supabase signIn
  avatarUrl?: string | null;
  /** Base64-encoded password for one-tap re-login. Optional. */
  pw?: string;
  lastUsedAt: number;
}

const KEY = 'loopgate_remembered_accounts';
const MAX = 4;

const enc = (s: string) => {
  try { return btoa(unescape(encodeURIComponent(s))); } catch { return ''; }
};
const dec = (s: string) => {
  try { return decodeURIComponent(escape(atob(s))); } catch { return ''; }
};

export function decodePassword(pw?: string): string {
  if (!pw) return '';
  return dec(pw);
}

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

export function rememberAccount(acc: { username: string; email: string; avatarUrl?: string | null; password?: string }) {
  try {
    const prior = getRememberedAccounts();
    const same = prior.find(a => a.email.toLowerCase() === acc.email.toLowerCase());
    const existing = prior.filter(
      (a) => a.email.toLowerCase() !== acc.email.toLowerCase(),
    );
    const pw = acc.password ? enc(acc.password) : same?.pw;
    const next: RememberedAccount[] = [
      {
        username: acc.username,
        email: acc.email,
        avatarUrl: acc.avatarUrl ?? same?.avatarUrl,
        pw,
        lastUsedAt: Date.now(),
      },
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