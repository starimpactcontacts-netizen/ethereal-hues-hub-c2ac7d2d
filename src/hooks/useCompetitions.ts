import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Competition {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  creator_id: string;
  creator_username: string;
  creator_avatar_url: string | null;
  league: string;
  scoring_mode: string;
  max_players: number;
  current_players: number;
  cover_image_url: string | null;
  status: string;
  started_at: string | null;
  deadline: string | null;
  index_reward_pool: number;
  slug: string | null;
  created_at: string;
  updated_at: string;
  inspo_video_url?: string | null;
  inspo_video_platform?: string | null;
  inspo_thumbnail_url?: string | null;
  upvote_count?: number;
}

export interface CompetitionParticipant {
  id: string;
  competition_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  joined_at: string;
  is_ready?: boolean;
}

export interface CompetitionSubmission {
  id: string;
  competition_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  score: number | null;
  judge_notes: string | null;
  is_winner: boolean;
  winner_place: number | null;
  scored_at: string | null;
  created_at: string;
}

export function useCompetitionsList() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .in("status", ["lobby", "live"])
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setCompetitions(data as any as Competition[]);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel("competitions-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "competitions" }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return { competitions, loading, refetch: fetch };
}

export function useCompetition(idOrSlug: string | undefined) {
  const { user, profile } = useAuth();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
  const [submissions, setSubmissions] = useState<CompetitionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug || "");

  const fetchAll = async () => {
    if (!idOrSlug) return;
    
    let query = supabase.from("competitions").select("*");
    if (isUUID) {
      query = query.eq("id", idOrSlug);
    } else {
      query = query.eq("slug", idOrSlug);
    }
    
    const { data: comp } = await query.single();
    if (!comp) { setLoading(false); return; }
    
    setCompetition(comp as any as Competition);

    const [{ data: parts }, { data: subs }] = await Promise.all([
      supabase.from("competition_participants").select("*").eq("competition_id", comp.id).order("joined_at"),
      supabase.from("competition_submissions").select("*").eq("competition_id", comp.id).order("created_at"),
    ]);

    if (parts) setParticipants(parts as any as CompetitionParticipant[]);
    if (subs) setSubmissions(subs as any as CompetitionSubmission[]);

    if (user?.id) {
      const { data: uv } = await supabase
        .from("competition_upvotes")
        .select("id")
        .eq("competition_id", comp.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setHasUpvoted(!!uv);
    } else {
      setHasUpvoted(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    if (!idOrSlug) return;
    
    const channel = supabase
      .channel(`comp-${idOrSlug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competitions" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_participants" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_upvotes" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [idOrSlug, user?.id]);

  const isCreator = user?.id === competition?.creator_id;
  const hasJoined = participants.some(p => p.user_id === user?.id);
  const hasSubmitted = submissions.some(s => s.user_id === user?.id);
  const isReady = participants.find(p => p.user_id === user?.id)?.is_ready === true;
  const readyCount = participants.filter(p => p.is_ready).length;

  const join = async () => {
    if (!user || !profile || !competition) return false;
    const { error } = await supabase.from("competition_participants").insert({
      competition_id: competition.id,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
    });
    if (error) return false;
    await fetchAll();
    return true;
  };

  const toggleReady = async () => {
    if (!user || !competition) return false;
    const me = participants.find(p => p.user_id === user.id);
    if (!me) return false;
    const next = !me.is_ready;
    const { error } = await supabase
      .from("competition_participants")
      .update({ is_ready: next } as any)
      .eq("competition_id", competition.id)
      .eq("user_id", user.id);
    if (error) return false;
    await fetchAll();
    return true;
  };

  const start = async () => {
    if (!competition || !isCreator) return false;
    const { error } = await supabase.from("competitions").update({
      status: "live",
      started_at: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }).eq("id", competition.id);
    if (error) return false;
    await fetchAll();
    return true;
  };

  const submit = async (url: string, platform: string) => {
    if (!user || !profile || !competition) return false;
    const { error } = await supabase.from("competition_submissions").insert({
      competition_id: competition.id,
      user_id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      submission_url: url,
      platform,
    });
    if (error) return false;
    await fetchAll();
    return true;
  };

  const toggleUpvote = async () => {
    if (!user || !competition) return false;
    if (hasUpvoted) {
      await supabase
        .from("competition_upvotes")
        .delete()
        .eq("competition_id", competition.id)
        .eq("user_id", user.id);
      setHasUpvoted(false);
      setCompetition(c => c ? { ...c, upvote_count: Math.max(0, (c.upvote_count || 0) - 1) } : c);
    } else {
      const { error } = await supabase
        .from("competition_upvotes")
        .insert({ competition_id: competition.id, user_id: user.id });
      if (error) return false;
      setHasUpvoted(true);
      setCompetition(c => c ? { ...c, upvote_count: (c.upvote_count || 0) + 1 } : c);
    }
    return true;
  };

  const updateInspo = async (params: { url: string; platform: string; thumbnail_url?: string | null }) => {
    if (!competition || !isCreator) return false;
    const { error } = await supabase.from("competitions").update({
      inspo_video_url: params.url,
      inspo_video_platform: params.platform,
      inspo_thumbnail_url: params.thumbnail_url ?? null,
    } as any).eq("id", competition.id);
    if (error) return false;
    await fetchAll();
    return true;
  };

  return {
    competition, participants, submissions, loading,
    isCreator, hasJoined, hasSubmitted, hasUpvoted, isReady, readyCount,
    join, start, submit, toggleUpvote, updateInspo, toggleReady, refetch: fetchAll,
  };
}
