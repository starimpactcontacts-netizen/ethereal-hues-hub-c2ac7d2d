import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PinnedEdit {
  id: string;
  user_id: string;
  title: string | null;
  platform: string;
  url: string;
  thumbnail_url: string | null;
  pin_order: number;
  created_at: string;
}

// Fetch pinned edits for a single user
export function usePinnedEdits(userId: string | undefined) {
  const [edits, setEdits] = useState<PinnedEdit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("pinned_edits")
      .select("*")
      .eq("user_id", userId)
      .order("pin_order", { ascending: true })
      .limit(3)
      .then(({ data }) => {
        setEdits((data as PinnedEdit[]) || []);
        setLoading(false);
      });
  }, [userId]);

  return { edits, loading };
}

// Fetch pinned edits for multiple users (batch)
export function useBatchPinnedEdits(userIds: string[]) {
  const [editsByUser, setEditsByUser] = useState<Record<string, PinnedEdit[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userIds.length) return;
    // Dedupe and limit
    const unique = [...new Set(userIds)].slice(0, 100);
    setLoading(true);
    supabase
      .from("pinned_edits")
      .select("*")
      .in("user_id", unique)
      .order("pin_order", { ascending: true })
      .then(({ data }) => {
        const map: Record<string, PinnedEdit[]> = {};
        (data as PinnedEdit[] || []).forEach((edit) => {
          if (!map[edit.user_id]) map[edit.user_id] = [];
          if (map[edit.user_id].length < 3) map[edit.user_id].push(edit);
        });
        setEditsByUser(map);
        setLoading(false);
      });
  }, [userIds.join(",")]);

  return { editsByUser, loading };
}

// Manage pinned edits (add/remove) for current user
export function usePinnedEditsManager(userId: string | undefined) {
  const { edits, loading } = usePinnedEdits(userId);
  const [saving, setSaving] = useState(false);

  async function addPinnedEdit(data: { title?: string; platform: string; url: string; thumbnail_url?: string }) {
    if (!userId) return { error: "Not logged in" };
    if (edits.length >= 3) return { error: "Maximum 3 pinned edits" };

    setSaving(true);
    const { error } = await supabase.from("pinned_edits").insert({
      user_id: userId,
      title: data.title || null,
      platform: data.platform,
      url: data.url,
      thumbnail_url: data.thumbnail_url || null,
      pin_order: edits.length,
    });
    setSaving(false);
    return { error: error?.message };
  }

  async function removePinnedEdit(editId: string) {
    if (!userId) return;
    setSaving(true);
    await supabase.from("pinned_edits").delete().eq("id", editId).eq("user_id", userId);
    setSaving(false);
  }

  return { edits, loading, saving, addPinnedEdit, removePinnedEdit };
}
