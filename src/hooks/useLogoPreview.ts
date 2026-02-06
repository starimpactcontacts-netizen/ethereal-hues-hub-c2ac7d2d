import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface LogoPreview {
  id: string;
  crew_id: string;
  uploaded_by: string;
  image_url: string;
  title: string;
  status: "active" | "approved" | "discarded";
  created_at: string;
  votes: VoteGroup[];
  total_votes: number;
}

export interface VoteGroup {
  emoji: string;
  count: number;
  voted: boolean;
}

const VOTE_EMOJIS = ["🔥", "❤️", "👍", "💎", "⚡"];

export function useLogoPreview(crewId: string | undefined) {
  const { user } = useAuth();
  const [previews, setPreviews] = useState<LogoPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchPreviews = useCallback(async () => {
    if (!crewId) return;
    setLoading(true);

    const { data: previewsData, error } = await supabase
      .from("unit_logo_previews")
      .select("*")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false });

    if (error || !previewsData) {
      setLoading(false);
      return;
    }

    if (previewsData.length === 0) {
      setPreviews([]);
      setLoading(false);
      return;
    }

    const previewIds = previewsData.map((p) => p.id);
    const { data: votesData } = await supabase
      .from("unit_logo_votes")
      .select("*")
      .in("preview_id", previewIds);

    const enriched: LogoPreview[] = previewsData.map((p) => {
      const pVotes = votesData?.filter((v) => v.preview_id === p.id) || [];
      const emojiMap = new Map<string, { count: number; voted: boolean }>();

      VOTE_EMOJIS.forEach((e) => emojiMap.set(e, { count: 0, voted: false }));

      pVotes.forEach((v) => {
        const existing = emojiMap.get(v.emoji) || { count: 0, voted: false };
        existing.count++;
        if (v.user_id === user?.id) existing.voted = true;
        emojiMap.set(v.emoji, existing);
      });

      const votes: VoteGroup[] = Array.from(emojiMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        voted: data.voted,
      }));

      return {
        ...p,
        status: p.status as LogoPreview["status"],
        votes,
        total_votes: pVotes.length,
      };
    });

    setPreviews(enriched);
    setLoading(false);
  }, [crewId, user?.id]);

  useEffect(() => {
    fetchPreviews();
  }, [fetchPreviews]);

  useEffect(() => {
    if (!crewId) return;
    channelRef.current = supabase
      .channel(`logo-previews-${crewId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "unit_logo_previews", filter: `crew_id=eq.${crewId}` }, () => fetchPreviews())
      .on("postgres_changes", { event: "*", schema: "public", table: "unit_logo_votes" }, () => fetchPreviews())
      .subscribe();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [crewId, fetchPreviews]);

  const uploadPreview = useCallback(
    async (file: File, title?: string) => {
      if (!crewId || !user) return null;
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${crewId}/logo-previews/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("crew-avatars").upload(path, file, { upsert: true });
      if (uploadError) {
        toast.error("Failed to upload file");
        return null;
      }

      const { data: urlData } = supabase.storage.from("crew-avatars").getPublicUrl(path);
      const isVideo = ["mp4", "webm", "mov", "gif"].includes(ext);

      const { data, error } = await supabase
        .from("unit_logo_previews")
        .insert({
          crew_id: crewId,
          uploaded_by: user.id,
          image_url: urlData.publicUrl,
          title: title || "Logo Preview",
          media_type: isVideo ? "video" : "image",
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to create preview");
        return null;
      }
      toast.success("Logo preview uploaded!");
      return data;
    },
    [crewId, user]
  );

  const addUrlPreview = useCallback(
    async (url: string, title?: string) => {
      if (!crewId || !user) return null;

      // Detect if URL is a video embed
      const isVideo = /\.(mp4|webm|mov|gif)/i.test(url) || 
        /streamable\.com|youtube\.com|youtu\.be/i.test(url);

      const { data, error } = await supabase
        .from("unit_logo_previews")
        .insert({
          crew_id: crewId,
          uploaded_by: user.id,
          image_url: url,
          title: title || "Logo Preview",
          media_type: isVideo ? "video" : "image",
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to add preview");
        return null;
      }
      toast.success("Logo preview added!");
      return data;
    },
    [crewId, user]
  );

  const vote = useCallback(
    async (previewId: string, emoji: string) => {
      if (!user) return;
      const preview = previews.find((p) => p.id === previewId);
      const existing = preview?.votes.find((v) => v.emoji === emoji && v.voted);

      if (existing) {
        await supabase.from("unit_logo_votes").delete().eq("preview_id", previewId).eq("user_id", user.id).eq("emoji", emoji);
      } else {
        // Remove any existing vote first (one vote per user per preview)
        await supabase.from("unit_logo_votes").delete().eq("preview_id", previewId).eq("user_id", user.id);
        await supabase.from("unit_logo_votes").insert({ preview_id: previewId, user_id: user.id, emoji });
      }
    },
    [user, previews]
  );

  const updateStatus = useCallback(
    async (previewId: string, status: "approved" | "discarded") => {
      const { error } = await supabase.from("unit_logo_previews").update({ status }).eq("id", previewId);
      if (error) toast.error("Failed to update status");
      else toast.success(status === "approved" ? "Logo approved! ✅" : "Logo discarded");
    },
    []
  );

  const deletePreview = useCallback(
    async (previewId: string) => {
      const { error } = await supabase.from("unit_logo_previews").delete().eq("id", previewId);
      if (error) toast.error("Failed to delete");
    },
    []
  );

  return { previews, loading, uploadPreview, addUrlPreview, vote, updateStatus, deletePreview, refresh: fetchPreviews };
}
