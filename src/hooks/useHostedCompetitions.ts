import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface HostedCompetition {
  id: string;
  name: string;
  description: string | null;
  host_user_id: string;
  host_crew_id: string | null;
  host_name: string;
  host_avatar_url: string | null;
  poster_url: string | null;
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
    description: string;
    host_name: string;
    format: string;
    max_submissions?: number;
    submission_deadline: string;
    prize_description?: string;
    poster_url?: string;
    host_crew_id?: string;
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

export function useHostedCompetition(competitionId: string | undefined) {
  const { user, profile } = useAuth();
  const [competition, setCompetition] = useState<HostedCompetition | null>(null);
  const [submissions, setSubmissions] = useState<HostedCompetitionSubmission[]>([]);
  const [judges, setJudges] = useState<HostedCompetitionJudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fetchCompetition = async () => {
    if (!competitionId) return;

    try {
      const { data: compData, error: compError } = await supabase
        .from('hosted_competitions')
        .select('*')
        .eq('id', competitionId)
        .maybeSingle();

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
        .eq('competition_id', competitionId)
        .order('submitted_at', { ascending: false });

      if (subsError) throw subsError;
      setSubmissions(subsData || []);
      setHasSubmitted(subsData?.some(s => s.user_id === user?.id) || false);

      // Fetch judges
      const { data: judgeData, error: judgeError } = await supabase
        .from('hosted_competition_judges')
        .select('*')
        .eq('competition_id', competitionId);

      if (judgeError) throw judgeError;
      setJudges(judgeData || []);
      setIsJudge(judgeData?.some(j => j.user_id === user?.id && j.status === 'accepted') || false);

    } catch (error: any) {
      console.error('Error fetching competition:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetition();

    if (!competitionId) return;

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`hosted_comp_${competitionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'hosted_competition_submissions',
        filter: `competition_id=eq.${competitionId}`
      }, () => {
        fetchCompetition();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId, user?.id]);

  const submitEntry = async (platform: string, submission_url: string) => {
    if (!user || !profile || !competitionId) {
      toast.error("You must be logged in");
      return false;
    }

    try {
      const { error } = await supabase
        .from('hosted_competition_submissions')
        .insert({
          competition_id: competitionId,
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
    if (!user || !competitionId) return false;

    try {
      const { error } = await supabase
        .from('hosted_competition_judges')
        .insert({
          competition_id: competitionId,
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
    loading,
    isHost,
    isJudge,
    hasSubmitted,
    submitEntry,
    scoreSubmission,
    inviteJudge,
    refetch: fetchCompetition
  };
}

export function usePendingHostedCompetitions() {
  const [pending, setPending] = useState<HostedCompetition[]>([]);
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

  useEffect(() => {
    fetchPending();
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

  return {
    pending,
    loading,
    approveCompetition,
    rejectCompetition,
    refetch: fetchPending
  };
}
