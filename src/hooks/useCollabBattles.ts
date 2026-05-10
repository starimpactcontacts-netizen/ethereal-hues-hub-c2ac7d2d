import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { CollabSlot } from "@/hooks/useCollabs";

export interface CollabBattleRow {
  id: string;
  slot_a_id: string;
  slot_b_id: string;
  status: string;
  score_a: number;
  score_b: number;
  reactions_a: number;
  reactions_b: number;
  judge_score_a: number;
  judge_score_b: number;
  winner_slot_id: string | null;
  started_at: string;
  ends_at: string;
}

export interface CollabBattle extends CollabBattleRow {
  slot_a: CollabSlot;
  slot_b: CollabSlot;
}

async function hydrateBattles(rows: CollabBattleRow[]): Promise<CollabBattle[]> {
  if (!rows.length) return [];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.slot_a_id, r.slot_b_id])));
  const { data: slots } = await supabase
    .from("collab_slots")
    .select("*")
    .in("id", ids);
  const map = new Map<string, CollabSlot>();
  (slots ?? []).forEach((s: any) => map.set(s.id, s as CollabSlot));
  return rows
    .map((r) => {
      const a = map.get(r.slot_a_id);
      const b = map.get(r.slot_b_id);
      if (!a || !b) return null;
      return { ...r, slot_a: a, slot_b: b } as CollabBattle;
    })
    .filter(Boolean) as CollabBattle[];
}

export function useCollabBattles() {
  const [liveBattles, setLiveBattles] = useState<CollabBattle[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("collab_battles")
      .select("*")
      .eq("status", "live")
      .order("started_at", { ascending: false })
      .limit(40);
    const hydrated = await hydrateBattles((data ?? []) as CollabBattleRow[]);
    setLiveBattles(hydrated);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("collab_battles_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "collab_battles" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh]);

  return { liveBattles, loading, refresh };
}

export function useCollabBattle(id: string | undefined) {
  const { user } = useAuth();
  const [battle, setBattle] = useState<CollabBattle | null>(null);
  const [myVote, setMyVote] = useState<{ pick_slot_id: string; qoi_score: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from("collab_battles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) {
      setBattle(null);
      setLoading(false);
      return;
    }
    const [hydrated] = await hydrateBattles([data as CollabBattleRow]);
    setBattle(hydrated ?? null);
    if (user) {
      const { data: v } = await supabase
        .from("collab_battle_judges")
        .select("pick_slot_id, qoi_score")
        .eq("battle_id", id)
        .eq("judge_id", user.id)
        .maybeSingle();
      setMyVote((v as any) ?? null);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
    if (!id) return;
    const ch = supabase
      .channel(`collab_battle_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "collab_battles", filter: `id=eq.${id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "collab_battle_judges", filter: `battle_id=eq.${id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, load]);

  const castJudgeVote = useCallback(
    async (pick_slot_id: string, qoi_score: number) => {
      if (!user || !id) return;
      await supabase
        .from("collab_battle_judges")
        .upsert(
          { battle_id: id, judge_id: user.id, pick_slot_id, qoi_score },
          { onConflict: "battle_id,judge_id" }
        );
      load();
    },
    [id, user, load]
  );

  return { battle, myVote, loading, reload: load, castJudgeVote };
}