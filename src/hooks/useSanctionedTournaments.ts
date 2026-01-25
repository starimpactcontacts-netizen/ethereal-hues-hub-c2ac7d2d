import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface SanctionedTournament {
  id: string;
  crew_id: string;
  proposed_by: string;
  crew_name: string;
  crew_avatar_url: string | null;
  name: string;
  description: string | null;
  theme: string | null;
  rules: string[] | null;
  min_players: number;
  max_players: number;
  duration_hours: number;
  format_type: string;
  status: string;
  rejection_reason: string | null;
  index_prize: number | null;
  first_place_index: number | null;
  second_place_index: number | null;
  third_place_index: number | null;
  xp_reward: number | null;
  approved_by: string | null;
  approved_at: string | null;
  admin_notes: string | null;
  proposed_start_date: string | null;
  start_date: string | null;
  end_date: string | null;
  ready_up_deadline: string | null;
  submission_deadline: string | null;
  player_count: number;
  ready_count: number;
  poster_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SanctionedParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_ready: boolean;
  ready_at: string | null;
  submission_url: string | null;
  submission_platform: string | null;
  submitted_at: string | null;
  bracket_position: number | null;
  eliminated_at: string | null;
  final_rank: number | null;
  qoi_score: number | null;
  joined_at: string;
}

export interface ProposeTournamentData {
  name: string;
  description?: string;
  theme?: string;
  rules?: string[];
  min_players?: number;
  max_players?: number;
  duration_hours?: number;
  format_type?: string;
  proposed_start_date?: string;
}

export function useSanctionedTournaments(statusFilter?: string[]) {
  const [tournaments, setTournaments] = useState<SanctionedTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTournaments = async () => {
    try {
      let query = supabase
        .from("sanctioned_tournaments")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter.length > 0) {
        query = query.in("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTournaments((data as SanctionedTournament[]) || []);
    } catch (err) {
      console.error("Error fetching sanctioned tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();

    // Real-time subscription
    const channel = supabase
      .channel("sanctioned-tournaments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sanctioned_tournaments" },
        () => fetchTournaments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter?.join(",")]);

  return { tournaments, loading, refetch: fetchTournaments };
}

export function useSanctionedTournament(tournamentId: string | null) {
  const [tournament, setTournament] = useState<SanctionedTournament | null>(null);
  const [participants, setParticipants] = useState<SanctionedParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const fetchTournament = async () => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("sanctioned_tournaments")
        .select("*")
        .eq("id", tournamentId)
        .maybeSingle();

      if (error) throw error;
      setTournament(data as SanctionedTournament);
    } catch (err) {
      console.error("Error fetching tournament:", err);
    }
  };

  const fetchParticipants = async () => {
    if (!tournamentId) return;

    try {
      const { data, error } = await supabase
        .from("sanctioned_tournament_participants")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      setParticipants((data as SanctionedParticipant[]) || []);
    } catch (err) {
      console.error("Error fetching participants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
    fetchParticipants();

    if (!tournamentId) return;

    const channel = supabase
      .channel(`sanctioned-tournament-${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sanctioned_tournaments", filter: `id=eq.${tournamentId}` },
        () => fetchTournament()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sanctioned_tournament_participants", filter: `tournament_id=eq.${tournamentId}` },
        () => fetchParticipants()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]);

  const isParticipant = participants.some((p) => p.user_id === user?.id);
  const userParticipation = participants.find((p) => p.user_id === user?.id);

  const joinTournament = async () => {
    if (!user || !profile || !tournamentId) return false;

    try {
      const { error } = await supabase
        .from("sanctioned_tournament_participants")
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
        });

      if (error) throw error;

      // Update player count
      await supabase
        .from("sanctioned_tournaments")
        .update({ player_count: (tournament?.player_count || 0) + 1 })
        .eq("id", tournamentId);

      toast.success("Joined tournament!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to join");
      return false;
    }
  };

  const leaveTournament = async () => {
    if (!user || !tournamentId) return false;

    try {
      const { error } = await supabase
        .from("sanctioned_tournament_participants")
        .delete()
        .eq("tournament_id", tournamentId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update player count
      await supabase
        .from("sanctioned_tournaments")
        .update({ player_count: Math.max(0, (tournament?.player_count || 1) - 1) })
        .eq("id", tournamentId);

      toast.success("Left tournament");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to leave");
      return false;
    }
  };

  const readyUp = async () => {
    if (!user || !tournamentId) return false;

    try {
      const { error } = await supabase
        .from("sanctioned_tournament_participants")
        .update({ is_ready: true, ready_at: new Date().toISOString() })
        .eq("tournament_id", tournamentId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update ready count
      await supabase
        .from("sanctioned_tournaments")
        .update({ ready_count: (tournament?.ready_count || 0) + 1 })
        .eq("id", tournamentId);

      toast.success("Ready!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to ready up");
      return false;
    }
  };

  return {
    tournament,
    participants,
    loading,
    isParticipant,
    userParticipation,
    joinTournament,
    leaveTournament,
    readyUp,
    refetch: () => {
      fetchTournament();
      fetchParticipants();
    },
  };
}

export function useProposeTournament() {
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const proposeTournament = async (crewId: string, crewName: string, crewAvatarUrl: string | null, data: ProposeTournamentData) => {
    if (!user) {
      toast.error("Must be logged in");
      return null;
    }

    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("sanctioned_tournaments")
        .insert({
          crew_id: crewId,
          proposed_by: user.id,
          crew_name: crewName,
          crew_avatar_url: crewAvatarUrl,
          name: data.name,
          description: data.description,
          theme: data.theme,
          rules: data.rules,
          min_players: data.min_players || 20,
          max_players: data.max_players || 64,
          duration_hours: data.duration_hours || 48,
          format_type: data.format_type || "single_elimination",
          proposed_start_date: data.proposed_start_date,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Tournament proposal submitted for admin review!");
      return inserted.id;
    } catch (err: any) {
      toast.error(err.message || "Failed to submit proposal");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { proposeTournament, submitting };
}
