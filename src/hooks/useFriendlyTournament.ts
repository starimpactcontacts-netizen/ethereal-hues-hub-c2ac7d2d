import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface FriendlyTournament {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  max_players: number;
  current_players: number;
  judge_id: string | null;
  judge_username: string | null;
  status: 'pending' | 'filling' | 'live' | 'bracket' | 'completed' | 'cancelled';
  bracket_data: Record<string, unknown>;
  duration_minutes: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  // Joined data
  creator?: { username: string; avatar_url: string | null };
  participants?: TournamentParticipant[];
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string | null;
  submission_platform: string | null;
  submitted_at: string | null;
  bracket_position: number | null;
  eliminated_at: string | null;
  final_rank: number | null;
  joined_at: string;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  max_players: 2 | 4 | 8 | 16;
  duration_minutes: number;
  judge_id?: string;
  judge_username?: string;
}

export function useFriendlyTournament(tournamentId?: string) {
  const { user, profile } = useAuth();
  const [tournament, setTournament] = useState<FriendlyTournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isJudge, setIsJudge] = useState(false);

  // Fetch tournament details
  const fetchTournament = useCallback(async () => {
    if (!tournamentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friendly_tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      setTournament(data as FriendlyTournament);
      setIsCreator(data.creator_id === user?.id);
      setIsJudge(data.judge_id === user?.id);
    } catch (err) {
      console.error('Error fetching tournament:', err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, user?.id]);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    if (!tournamentId) return;

    try {
      const { data, error } = await supabase
        .from('friendly_tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      setParticipants(data as TournamentParticipant[]);
      setIsParticipant(data.some(p => p.user_id === user?.id));
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  }, [tournamentId, user?.id]);

  // Create tournament
  const createTournament = useCallback(async (data: CreateTournamentData): Promise<string | null> => {
    if (!user || !profile) {
      toast.error("You must be logged in");
      return null;
    }

    try {
      const { data: newTournament, error } = await supabase
        .from('friendly_tournaments')
        .insert({
          creator_id: user.id,
          name: data.name,
          description: data.description || null,
          max_players: data.max_players,
          duration_minutes: data.duration_minutes,
          judge_id: data.judge_id || null,
          judge_username: data.judge_username || null,
          status: 'filling',
          current_players: 1, // Creator auto-joins
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator as first participant
      const { error: joinError } = await supabase
        .from('friendly_tournament_participants')
        .insert({
          tournament_id: newTournament.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          bracket_position: 1,
        });

      if (joinError) throw joinError;

      toast.success("Tournament created!", {
        description: "Share it with friends to fill the room."
      });

      return newTournament.id;
    } catch (err) {
      console.error('Error creating tournament:', err);
      toast.error("Failed to create tournament");
      return null;
    }
  }, [user, profile]);

  // Join tournament
  const joinTournament = useCallback(async () => {
    if (!user || !profile || !tournament) {
      toast.error("Cannot join tournament");
      return false;
    }

    if (tournament.current_players >= tournament.max_players) {
      toast.error("Tournament is full");
      return false;
    }

    try {
      // Add participant
      const { error: joinError } = await supabase
        .from('friendly_tournament_participants')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          bracket_position: tournament.current_players + 1,
        });

      if (joinError) throw joinError;

      // Update player count
      const newCount = tournament.current_players + 1;
      const updates: Record<string, unknown> = { current_players: newCount };
      
      // Auto-start if room is full
      if (newCount >= tournament.max_players) {
        updates.status = 'live';
        updates.started_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('friendly_tournaments')
        .update(updates)
        .eq('id', tournament.id);

      if (updateError) throw updateError;

      toast.success("You joined the tournament!");
      setIsParticipant(true);
      fetchTournament();
      fetchParticipants();
      return true;
    } catch (err) {
      console.error('Error joining tournament:', err);
      toast.error("Failed to join tournament");
      return false;
    }
  }, [user, profile, tournament, fetchTournament, fetchParticipants]);

  // Leave tournament
  const leaveTournament = useCallback(async () => {
    if (!user || !tournament) return false;

    try {
      const { error: leaveError } = await supabase
        .from('friendly_tournament_participants')
        .delete()
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id);

      if (leaveError) throw leaveError;

      // Update player count
      const { error: updateError } = await supabase
        .from('friendly_tournaments')
        .update({ current_players: tournament.current_players - 1 })
        .eq('id', tournament.id);

      if (updateError) throw updateError;

      toast.success("Left the tournament");
      setIsParticipant(false);
      fetchTournament();
      fetchParticipants();
      return true;
    } catch (err) {
      console.error('Error leaving tournament:', err);
      toast.error("Failed to leave tournament");
      return false;
    }
  }, [user, tournament, fetchTournament, fetchParticipants]);

  // Submit to tournament
  const submitToTournament = useCallback(async (submissionUrl: string, platform: string) => {
    if (!user || !tournament) return false;

    try {
      const { error } = await supabase
        .from('friendly_tournament_participants')
        .update({
          submission_url: submissionUrl,
          submission_platform: platform,
          submitted_at: new Date().toISOString(),
        })
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Submission received!");
      fetchParticipants();
      return true;
    } catch (err) {
      console.error('Error submitting:', err);
      toast.error("Failed to submit");
      return false;
    }
  }, [user, tournament, fetchParticipants]);

  // Cancel tournament (creator only)
  const cancelTournament = useCallback(async () => {
    if (!user || !tournament || tournament.creator_id !== user.id) return false;

    try {
      const { error } = await supabase
        .from('friendly_tournaments')
        .update({ status: 'cancelled' })
        .eq('id', tournament.id);

      if (error) throw error;

      toast.success("Tournament cancelled");
      fetchTournament();
      return true;
    } catch (err) {
      console.error('Error cancelling:', err);
      toast.error("Failed to cancel");
      return false;
    }
  }, [user, tournament, fetchTournament]);

  // Start tournament manually (if creator doesn't want to wait for full room)
  const startTournament = useCallback(async () => {
    if (!user || !tournament || tournament.creator_id !== user.id) return false;

    if (tournament.current_players < 2) {
      toast.error("Need at least 2 players to start");
      return false;
    }

    try {
      const { error } = await supabase
        .from('friendly_tournaments')
        .update({ 
          status: 'live',
          started_at: new Date().toISOString(),
        })
        .eq('id', tournament.id);

      if (error) throw error;

      toast.success("Tournament started!");
      fetchTournament();
      return true;
    } catch (err) {
      console.error('Error starting:', err);
      toast.error("Failed to start tournament");
      return false;
    }
  }, [user, tournament, fetchTournament]);

  // Real-time subscription
  useEffect(() => {
    if (!tournamentId) return;

    fetchTournament();
    fetchParticipants();

    const channel = supabase
      .channel(`friendly-tournament-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendly_tournaments',
          filter: `id=eq.${tournamentId}`,
        },
        () => {
          fetchTournament();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendly_tournament_participants',
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, fetchTournament, fetchParticipants]);

  return {
    tournament,
    participants,
    loading,
    isParticipant,
    isCreator,
    isJudge,
    createTournament,
    joinTournament,
    leaveTournament,
    submitToTournament,
    cancelTournament,
    startTournament,
    refetch: () => {
      fetchTournament();
      fetchParticipants();
    },
  };
}

// Hook to list all open tournaments
export function useFriendlyTournamentList() {
  const [tournaments, setTournaments] = useState<FriendlyTournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<FriendlyTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch open tournaments (filling status)
      const { data: openData, error: openError } = await supabase
        .from('friendly_tournaments')
        .select('*')
        .in('status', ['filling', 'live'])
        .order('created_at', { ascending: false });

      if (openError) throw openError;
      setTournaments(openData as FriendlyTournament[]);

      // Fetch user's tournaments (as creator or participant)
      if (user) {
        const { data: participations } = await supabase
          .from('friendly_tournament_participants')
          .select('tournament_id')
          .eq('user_id', user.id);

        const participatingIds = participations?.map(p => p.tournament_id) || [];

        const { data: myData, error: myError } = await supabase
          .from('friendly_tournaments')
          .select('*')
          .or(`creator_id.eq.${user.id},id.in.(${participatingIds.join(',')})`)
          .in('status', ['filling', 'live', 'bracket'])
          .order('created_at', { ascending: false });

        if (!myError && myData) {
          setMyTournaments(myData as FriendlyTournament[]);
        }
      }
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTournaments();

    // Real-time subscription for new tournaments
    const channel = supabase
      .channel('friendly-tournaments-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendly_tournaments',
        },
        () => {
          fetchTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTournaments]);

  return {
    tournaments,
    myTournaments,
    loading,
    refetch: fetchTournaments,
  };
}
