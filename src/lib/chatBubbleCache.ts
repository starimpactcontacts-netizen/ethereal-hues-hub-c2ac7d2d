import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

// Global cache of user_id -> equipped_chat_bubble (null = none).
const cache = new Map<string, string | null>();
const pending = new Set<string>();
const inflight = new Set<string>();
const subscribers = new Set<() => void>();
let version = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

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
  if (pending.size === 0) return;
  const ids = Array.from(pending).filter((id) => !inflight.has(id));
  pending.clear();
  if (ids.length === 0) return;
  ids.forEach((id) => inflight.add(id));
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, equipped_chat_bubble")
      .in("id", ids);
    const seen = new Set<string>();
    if (data) {
      for (const row of data as Array<{ id: string; equipped_chat_bubble: string | null }>) {
        cache.set(row.id, row.equipped_chat_bubble ?? null);
        seen.add(row.id);
      }
    }
    for (const id of ids) if (!seen.has(id)) cache.set(id, null);
    notify();
  } catch {
    for (const id of ids) cache.set(id, null);
    notify();
  } finally {
    for (const id of ids) inflight.delete(id);
  }
}

function queue(id: string) {
  if (!id) return;
  if (cache.has(id) || inflight.has(id) || pending.has(id)) return;
  pending.add(id);
  if (flushTimer == null) flushTimer = setTimeout(flush, 60);
}

function ensureRealtimeSync() {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel("global-chat-bubble-sync")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles" },
      (payload) => {
        const row = payload.new as { id?: string; equipped_chat_bubble?: string | null };
        if (!row?.id) return;
        primeChatBubble(row.id, row.equipped_chat_bubble ?? null);
      }
    )
    .subscribe();
}

export function primeChatBubble(userId: string, bubble: string | null) {
  if (!userId) return;
  const prev = cache.get(userId);
  cache.set(userId, bubble ?? null);
  if (prev !== (bubble ?? null)) notify();
}

export function useChatBubble(userId?: string | null): string | null {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    ensureRealtimeSync();
    if (userId) queue(userId);
  }, [userId]);
  if (!userId) return null;
  return cache.get(userId) ?? null;
}