import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CollabEmoji = "fire" | "zap" | "diamond" | "crown" | "clapper";
export type CollabStatus =
  | "open"
  | "paired"
  | "editing"
  | "pending_approval"
  | "live"
  | "rejected"
  | "expired";

export interface CollabSlot {
  id: string;
  creator_id: string;
  creator_username: string;
  creator_avatar_url: string | null;
  partner_id: string | null;
  partner_username: string | null;
  partner_avatar_url: string | null;
  song_title: string;
  song_artist: string | null;
  song_url: string | null;
  total_duration_seconds: number;
  creator_segment: string;
  partner_segment: string;
  status: CollabStatus;
  final_video_url: string | null;
  social_url: string | null;
  uploaded_by: string | null;
  creator_approved: boolean;
  partner_approved: boolean;
  reaction_score: number;
  total_reactions: number;
  created_at: string;
  paired_at: string | null;
  uploaded_at: string | null;
  live_at: string | null;
  expires_at: string;
  submit_deadline_at: string | null;
  challenges_slot_id?: string | null;
}

export function useCollabs() {
  const { user } = useAuth();
  const [openSlots, setOpenSlots] = useState<CollabSlot[]>([]);
  const [liveSlots, setLiveSlots] = useState<CollabSlot[]>([]);
  const [mySlots, setMySlots] = useState<CollabSlot[]>([]);
  const [topToday, setTopToday] = useState<CollabSlot[]>([]);
  const [pairedSlots, setPairedSlots] = useState<CollabSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [openRes, liveRes, topRes, mineRes, pairedRes] = await Promise.all([
      supabase
        .from("collab_slots")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("collab_slots")
        .select("*")
        .eq("status", "live")
        .order("live_at", { ascending: false })
        .limit(50),
      supabase
        .from("collab_slots")
        .select("*")
        .eq("status", "live")
        .gte("live_at", since)
        .order("reaction_score", { ascending: false })
        .limit(10),
      user
        ? supabase
            .from("collab_slots")
            .select("*")
            .or(`creator_id.eq.${user.id},partner_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] as any[] }),
      supabase
        .from("collab_slots")
        .select("*")
        .in("status", ["paired", "editing", "pending_approval"])
        .order("paired_at", { ascending: false })
        .limit(50),
    ]);

    setOpenSlots((openRes.data ?? []) as CollabSlot[]);
    setLiveSlots((liveRes.data ?? []) as CollabSlot[]);
    setTopToday((topRes.data ?? []) as CollabSlot[]);
    setPairedSlots(((pairedRes as any).data ?? []) as CollabSlot[]);
    const mine = ((mineRes as any).data ?? []) as CollabSlot[];
    setMySlots(mine);
    setLoading(false);

    // Self-heal: if any of "my" slots have an email-looking username stored,
    // replace it with the real profile username + avatar.
    if (user && mine.length) {
      const looksLikeEmail = (s?: string | null) => !!s && /@/.test(s);
      const needsFix = mine.some(
        (s) =>
          (s.creator_id === user.id && looksLikeEmail(s.creator_username)) ||
          (s.partner_id === user.id && looksLikeEmail(s.partner_username)),
      );
      if (needsFix) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        const username = (prof as any)?.username;
        const avatar = (prof as any)?.avatar_url ?? null;
        if (username) {
          await Promise.all(
            mine.map(async (s) => {
              if (s.creator_id === user.id && looksLikeEmail(s.creator_username)) {
                await supabase
                  .from("collab_slots")
                  .update({ creator_username: username, creator_avatar_url: avatar })
                  .eq("id", s.id);
              } else if (s.partner_id === user.id && looksLikeEmail(s.partner_username)) {
                await supabase
                  .from("collab_slots")
                  .update({ partner_username: username, partner_avatar_url: avatar })
                  .eq("id", s.id);
              }
            }),
          );
        }
      }
    }
  }, [user]);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("collab_slots_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collab_slots" },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh]);

  return { openSlots, liveSlots, mySlots, topToday, pairedSlots, loading, refresh };
}

export function useCollabSlot(id: string | undefined) {
  const [slot, setSlot] = useState<CollabSlot | null>(null);
  const [reactions, setReactions] = useState<
    { emoji: CollabEmoji; count: number; mine: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [slotRes, reactRes] = await Promise.all([
      supabase.from("collab_slots").select("*").eq("id", id).maybeSingle(),
      supabase.from("collab_reactions").select("emoji, user_id").eq("slot_id", id),
    ]);
    setSlot((slotRes.data as CollabSlot) ?? null);
    const counts: Record<string, { count: number; mine: boolean }> = {};
    for (const r of (reactRes.data ?? []) as any[]) {
      const k = r.emoji as string;
      if (!counts[k]) counts[k] = { count: 0, mine: false };
      counts[k].count += 1;
      if (user && r.user_id === user.id) counts[k].mine = true;
    }
    const emojis: CollabEmoji[] = ["fire", "zap", "diamond", "crown", "clapper"];
    setReactions(
      emojis.map((e) => ({
        emoji: e,
        count: counts[e]?.count ?? 0,
        mine: counts[e]?.mine ?? false,
      }))
    );
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
    if (!id) return;
    const ch = supabase
      .channel(`collab_slot_${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collab_slots", filter: `id=eq.${id}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collab_reactions", filter: `slot_id=eq.${id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, load]);

  const toggleReaction = useCallback(
    async (emoji: CollabEmoji) => {
      if (!user || !id) return;
      const existing = reactions.find((r) => r.emoji === emoji);
      if (existing?.mine) {
        await supabase
          .from("collab_reactions")
          .delete()
          .eq("slot_id", id)
          .eq("user_id", user.id)
          .eq("emoji", emoji);
      } else {
        await supabase.from("collab_reactions").insert({
          slot_id: id,
          user_id: user.id,
          emoji,
        });
      }
      load();
    },
    [id, user, reactions, load]
  );

  return { slot, reactions, loading, reload: load, toggleReaction };
}

export async function createCollabSlot(input: {
  song_title: string;
  song_artist?: string;
  song_url?: string;
  total_duration_seconds: number;
  creator_segment: string;
  partner_segment: string;
  challenges_slot_id?: string | null;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { data: prof } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", auth.user.id)
    .maybeSingle();
  const username =
    (prof as any)?.username ||
    (auth.user.user_metadata as any)?.username ||
    (auth.user.user_metadata as any)?.full_name ||
    "editor";
  const avatar =
    (prof as any)?.avatar_url ||
    (auth.user.user_metadata as any)?.avatar_url ||
    (auth.user.user_metadata as any)?.picture ||
    null;

  const { data, error } = await supabase
    .from("collab_slots")
    .insert({
      creator_id: auth.user.id,
      creator_username: username,
      creator_avatar_url: avatar,
      song_title: input.song_title,
      song_artist: input.song_artist ?? null,
      song_url: input.song_url ?? null,
      total_duration_seconds: input.total_duration_seconds,
      creator_segment: input.creator_segment,
      partner_segment: input.partner_segment,
      challenges_slot_id: input.challenges_slot_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CollabSlot;
}

export async function joinCollabSlot(slotId: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { data: prof } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", auth.user.id)
    .maybeSingle();
  const username =
    (prof as any)?.username ||
    (auth.user.user_metadata as any)?.username ||
    (auth.user.user_metadata as any)?.full_name ||
    "editor";
  const avatar =
    (prof as any)?.avatar_url ||
    (auth.user.user_metadata as any)?.avatar_url ||
    (auth.user.user_metadata as any)?.picture ||
    null;

  const { data, error } = await supabase
    .from("collab_slots")
    .update({
      partner_id: auth.user.id,
      partner_username: username,
      partner_avatar_url: avatar,
    })
    .eq("id", slotId)
    .eq("status", "open")
    .is("partner_id", null)
    .select()
    .single();
  if (error) throw error;
  return data as CollabSlot;
}

export async function cancelCollabSlot(slotId: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  // Only allow canceling your own open seat with no partner yet.
  const { error } = await supabase
    .from("collab_slots")
    .delete()
    .eq("id", slotId)
    .eq("creator_id", auth.user.id)
    .eq("status", "open")
    .is("partner_id", null);
  if (error) throw error;
}

export async function uploadCollabVideo(
  slotId: string,
  videoUrl: string,
  socialUrl?: string | null
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("collab_slots")
    .update({
      final_video_url: videoUrl,
      social_url: socialUrl ?? null,
      uploaded_by: auth.user.id,
    })
    .eq("id", slotId);
  if (error) throw error;
}

export async function approveCollab(slotId: string, asPartner: boolean) {
  const patch = asPartner
    ? { partner_approved: true }
    : { creator_approved: true };
  const { error } = await supabase
    .from("collab_slots")
    .update(patch)
    .eq("id", slotId);
  if (error) throw error;
}