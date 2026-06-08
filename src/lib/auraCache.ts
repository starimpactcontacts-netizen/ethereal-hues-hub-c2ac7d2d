import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// Global cache of user_id -> equipped_aura (null = no aura).
const cache = new Map<string, string | null>();
const usernameCache = new Map<string, string | null>();
const tintCache = new Map<string, Record<string, string>>();
const pending = new Set<string>();
const pendingUsernames = new Set<string>();
const inflight = new Set<string>();
const inflightUsernames = new Set<string>();
const subscribers = new Set<() => void>();
let version = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let profileAuraChannel: ReturnType<typeof supabase.channel> | null = null;

function notify() {
  version++;
  for (const s of subscribers) s();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

function getSnapshot() {
  return version;
}

async function flush() {
  flushTimer = null;
  if (pendingUsernames.size > 0) void flushUsernames();
  if (pending.size === 0) return;
  const ids = Array.from(pending).filter((id) => !inflight.has(id));
  pending.clear();
  if (ids.length === 0) return;
  ids.forEach((id) => inflight.add(id));
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, equipped_aura, aura_tints")
      .in("id", ids);
    const seen = new Set<string>();
    if (data) {
      for (const row of data as Array<{ id: string; username?: string | null; equipped_aura: string | null; aura_tints?: Record<string, string> | null }>) {
        cache.set(row.id, row.equipped_aura ?? null);
        tintCache.set(row.id, row.aura_tints ?? {});
        if (row.username) usernameCache.set(row.username.toLowerCase(), row.equipped_aura ?? null);
        seen.add(row.id);
      }
    }
    // Cache misses still get a null entry so we don't refetch endlessly.
    for (const id of ids) if (!seen.has(id)) cache.set(id, null);
    notify();
  } catch {
    // On failure, mark as null so we don't loop.
    for (const id of ids) cache.set(id, null);
    notify();
  } finally {
    for (const id of ids) inflight.delete(id);
  }
}

async function flushUsernames() {
  if (pendingUsernames.size === 0) return;
  const names = Array.from(pendingUsernames).filter((name) => !inflightUsernames.has(name));
  pendingUsernames.clear();
  if (names.length === 0) return;
  names.forEach((name) => inflightUsernames.add(name));
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, equipped_aura, aura_tints")
      .in("username", names);
    const seen = new Set<string>();
    if (data) {
      for (const row of data as Array<{ id: string; username: string; equipped_aura: string | null; aura_tints?: Record<string, string> | null }>) {
        cache.set(row.id, row.equipped_aura ?? null);
        tintCache.set(row.id, row.aura_tints ?? {});
        usernameCache.set(row.username.toLowerCase(), row.equipped_aura ?? null);
        seen.add(row.username.toLowerCase());
      }
    }
    for (const name of names) if (!seen.has(name)) usernameCache.set(name, null);
    notify();
  } catch {
    for (const name of names) usernameCache.set(name, null);
    notify();
  } finally {
    for (const name of names) inflightUsernames.delete(name);
  }
}

function queue(id: string) {
  if (!id) return;
  if (cache.has(id) || inflight.has(id) || pending.has(id)) return;
  pending.add(id);
  if (flushTimer == null) flushTimer = setTimeout(flush, 60);
}

function queueUsername(username: string) {
  const normalized = username.trim().replace(/^@/, "").toLowerCase();
  if (!normalized) return;
  if (usernameCache.has(normalized) || inflightUsernames.has(normalized) || pendingUsernames.has(normalized)) return;
  pendingUsernames.add(normalized);
  if (flushTimer == null) flushTimer = setTimeout(flush, 60);
}

function ensureRealtimeAuraSync() {
  if (profileAuraChannel) return;
  profileAuraChannel = supabase
    .channel("global-profile-aura-sync")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles" },
      (payload) => {
        const row = payload.new as { id?: string; username?: string | null; equipped_aura?: string | null };
        if (!row?.id) return;
        const nextAura = row.equipped_aura ?? null;
        const prevByUsername = row.username ? usernameCache.get(row.username.toLowerCase()) : undefined;
        if (row.username) usernameCache.set(row.username.toLowerCase(), nextAura);
        primeAura(row.id, row.equipped_aura ?? null);
        if (row.username && prevByUsername !== nextAura) notify();
      }
    )
    .subscribe();
}

export function primeAura(userId: string, aura: string | null) {
  if (!userId) return;
  const prev = cache.get(userId);
  cache.set(userId, aura ?? null);
  if (prev !== (aura ?? null)) notify();
}

export function primeAuraTints(userId: string, tints: Record<string, string>) {
  if (!userId) return;
  tintCache.set(userId, tints ?? {});
  notify();
}

export function useAuraTint(userId?: string | null, auraSlug?: string | null): string | null {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (!userId || !auraSlug) return null;
  const tints = tintCache.get(userId);
  return tints?.[auraSlug.toLowerCase()] ?? null;
}

export function useAuraByUsername(username?: string | null): string | null {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    ensureRealtimeAuraSync();
    if (username) queueUsername(username);
  }, [username]);
  if (!username) return null;
  return usernameCache.get(username.trim().replace(/^@/, "").toLowerCase()) ?? null;
}

export function useAura(userId?: string | null): string | null {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    ensureRealtimeAuraSync();
    if (userId) queue(userId);
  }, [userId]);
  if (!userId) return null;
  return cache.get(userId) ?? null;
}
