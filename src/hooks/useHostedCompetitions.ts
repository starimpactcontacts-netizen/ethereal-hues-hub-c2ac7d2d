import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface HostedCompetition {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  host_user_id: string;
  host_crew_id: string | null;
  host_name: string;
  host_avatar_url: string | null;
  poster_url: string | null;
  poster_urls: string[] | null;
  format: string;
  max_submissions: number | null;
  submission_deadline: string;
  status: string;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  prize_description: string | null;
  created_at: string;
  updated_at: string;
  submission_count?: number;
  is_featured?: boolean;
  featured_at?: string | null;
  community_url?: string | null;
  rules?: string | null;
  view_count?: number;
  participant_count?: number;
  is_trending?: boolean;
}

export interface HostedCompetitionSubmission {
  id: string;
  competition_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  platform: string;
  submission_url: string;
  score: number | null;
  scored_by: string | null;
  scored_at: string | null;
  judge_notes: string | null;
  final_rank: number | null;
  submitted_at: string;
  creativity_score?: number | null;
  quality_score?: number | null;
  impact_score?: number | null;
  is_winner?: boolean;
  winner_place?: number | null;
}

export interface HostedCompetitionJudge {
  id: string;
  competition_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  status: string;
}

export function useHostedCompetitions() {
  const { user, profile } = useAuth();
  const [competitions, setCompetitions] = useState<HostedCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompetitions = async () => {
    try {
      const { data, error } = await supabase
        .from('hosted_competitions')
        .select('*')
        .in('status', ['live', 'judging', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get submission counts
      const compsWithCounts = await Promise.all((data || []).map(async (comp) => {
        const { count } = await supabase
          .from('hosted_competition_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('competition_id', comp.id);
        return { ...comp, submission_count: count || 0 };
      }));
      
      setCompetitions(compsWithCounts);
    } catch (error: any) {
      console.error('Error fetching hosted competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('hosted_competitions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hosted_competitions' }, () => {
        fetchCompetitions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const proposeCompetition = async (data: {
    name: string;
    description?: string;
    host_name: string;
    format: string;
    max_submissions?: number;
    submission_deadline: string;
    prize_description?: string;
    poster_url?: string;
    poster_urls?: string[];
    host_crew_id?: string;
    community_url?: string;
    rules?: string;
  }) => {
    if (!user || !profile) {
      toast.error("You must be logged in");
      return null;
    }

    try {
      const { data: newComp, error } = await supabase
        .from('hosted_competitions')
        .insert({
          ...data,
          host_user_id: user.id,
          host_avatar_url: profile.avatar_url,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Competition proposal submitted for review!");
      return newComp;
    } catch (error: any) {
      console.error('Error proposing competition:', error);
      toast.error(error.message || "Failed to submit proposal");
      return null;
    }
  };

  return {
    competitions,
    loading,
    proposeCompetition,
    refetch: fetchCompetitions
  };
}

export function useHostedCompetition(idOrSlug: string | undefined) {
  const { user, profile } = useAuth();
  const [competition, setCompetition] = useState<HostedCompetition | null>(null);
  const [submissions, setSubmissions] = useState<HostedCompetitionSubmission[]>([]);
  const [judges, setJudges] = useState<HostedCompetitionJudge[]>([]);
  const [participants, setParticipants] = useState<{ id: string; user_id: string; username: string; avatar_url: string | null; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Check if idOrSlug is a UUID or a slug
  const isUUID = idOrSlug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const fetchCompetition = async () => {
    if (!idOrSlug) return;

    try {
      // Try UUID first, then slug
      let query = supabase.from('hosted_competitions').select('*');
      
      if (isUUID) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }
      
      const { data: compData, error: compError } = await query.maybeSingle();

      if (compError) throw compError;
      if (!compData) {
        setLoading(false);
        return;
      }

      setCompetition(compData);
      setIsHost(user?.id === compData.host_user_id);

      // Fetch submissions
      const { data: subsData, error: subsError } = await supabase
        .from('hosted_competition_submissions')
        .select('*')
        .eq('competition_id', compData.id)
        .order('submitted_at', { ascending: false });

      if (subsError) throw subsError;
      setSubmissions(subsData || []);
      setHasSubmitted(subsData?.some(s => s.user_id === user?.id) || false);

      // Fetch judges
      const { data: judgeData, error: judgeError } = await supabase
        .from('hosted_competition_judges')
        .select('*')
        .eq('competition_id', compData.id);

      if (judgeError) throw judgeError;
      setJudges(judgeData || []);
      setIsJudge(judgeData?.some(j => j.user_id === user?.id && j.status === 'accepted') || false);

      // Fetch participants
      const { data: participantData } = await supabase
        .from('hosted_competition_participants' as any)
        .select('*')
        .eq('competition_id', compData.id);

      const typedParticipants = (participantData as unknown as { id: string; user_id: string; username: string; avatar_url: string | null; }[]) || [];
      setParticipants(typedParticipants);
      setHasJoined(typedParticipants.some(p => p.user_id === user?.id));

    } catch (error: any) {
      console.error('Error fetching competition:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetition();

    if (!idOrSlug) return;

    // Subscribe to realtime updates - use idOrSlug for channel naming
    const channel = supabase
      .channel(`hosted_comp_${idOrSlug}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'hosted_competition_submissions'
      }, () => {
        fetchCompetition();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idOrSlug, user?.id]);

  const submitEntry = async (platform: string, submission_url: string) => {
    if (!user || !profile || !competition) {
      toast.error("You must be logged in");
      return false;
    }

    try {
      const { error } = await supabase
        .from('hosted_competition_submissions')
        .insert({
          competition_id: competition.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          platform,
          submission_url
        });

      if (error) throw error;
      
      toast.success("Submission received!");
      fetchCompetition();
      return true;
    } catch (error: any) {
      console.error('Error submitting:', error);
      toast.error(error.message || "Failed to submit");
      return false;
    }
  };

  const scoreSubmission = async (submissionId: string, score: number, notes?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('hosted_competition_submissions')
        .update({
          score,
          judge_notes: notes,
          scored_by: user.id,
          scored_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      
      toast.success("Score saved!");
      fetchCompetition();
      return true;
    } catch (error: any) {
      console.error('Error scoring:', error);
      toast.error(error.message || "Failed to save score");
      return false;
    }
  };

  const inviteJudge = async (userId: string, username: string, avatarUrl?: string) => {
    if (!user || !competition) return false;

    try {
      const { error } = await supabase
        .from('hosted_competition_judges')
        .insert({
          competition_id: competition.id,
          user_id: userId,
          username,
          avatar_url: avatarUrl,
          invited_by: user.id
        });

      if (error) throw error;
      
      toast.success(`Invited ${username} as judge!`);
      fetchCompetition();
      return true;
    } catch (error: any) {
      console.error('Error inviting judge:', error);
      toast.error(error.message || "Failed to invite");
      return false;
    }
  };

  return {
    competition,
    submissions,
    judges,
    participants,
    loading,
    isHost,
    isJudge,
    hasSubmitted,
    hasJoined,
    submitEntry,
    scoreSubmission,
    inviteJudge,
    refetch: fetchCompetition
  };
}

export function usePendingHostedCompetitions() {
  const [pending, setPending] = useState<HostedCompetition[]>([]);
  const [liveComps, setLiveComps] = useState<HostedCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const { data, error } = await supabase
        .from('hosted_competitions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPending(data || []);
    } catch (error: any) {
      console.error('Error fetching pending:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveComps = async () => {
    try {
      const { data, error } = await supabase
        .from('hosted_competitions')
        .select('*')
        .in('status', ['live', 'judging'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLiveComps(data || []);
    } catch (error: any) {
      console.error('Error fetching live comps:', error);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchLiveComps();
  }, []);

  const approveCompetition = async (id: string, approverId: string) => {
    try {
      const { error } = await supabase
        .from('hosted_competitions')
        .update({
          status: 'live',
          approved_at: new Date().toISOString(),
          approved_by: approverId
        })
        .eq('id', id);

      if (error) throw error;
      toast.success("Competition approved and now live!");
      fetchPending();
      fetchLiveComps();
      return true;
    } catch (error: any) {
      console.error('Error approving:', error);
      toast.error("Failed to approve");
      return false;
    }
  };

  const rejectCompetition = async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('hosted_competitions')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', id);

      if (error) throw error;
      toast.success("Competition rejected");
      fetchPending();
      return true;
    } catch (error: any) {
      console.error('Error rejecting:', error);
      toast.error("Failed to reject");
      return false;
    }
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('hosted_competitions')
        .update({
          is_featured: !isFeatured,
          featured_at: !isFeatured ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(!isFeatured ? "Competition featured!" : "Competition unfeatured");
      fetchLiveComps();
      return true;
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      toast.error("Failed to update");
      return false;
    }
  };

  const deleteCompetition = async (id: string) => {
    try {
      // First delete related data
      await supabase
        .from('hosted_competition_submissions')
        .delete()
        .eq('competition_id', id);

      await supabase
        .from('hosted_competition_judges')
        .delete()
        .eq('competition_id', id);

      await supabase
        .from('hosted_competition_participants' as any)
        .delete()
        .eq('competition_id', id);

      await supabase
        .from('hosted_comp_messages')
        .delete()
        .eq('competition_id', id);

      // Then delete the competition itself
      const { error } = await supabase
        .from('hosted_competitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Competition deleted");
      fetchPending();
      fetchLiveComps();
      return true;
    } catch (error: any) {
      console.error('Error deleting competition:', error);
      toast.error("Failed to delete competition");
      return false;
    }
  };

  return {
    pending,
    liveComps,
    loading,
    approveCompetition,
    rejectCompetition,
    toggleFeatured,
    deleteCompetition,
    refetch: () => { fetchPending(); fetchLiveComps(); }
  };
}
