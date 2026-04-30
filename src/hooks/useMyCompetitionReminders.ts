import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type MyCompetitionReminder = {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  voting_deadline: string | null;
  slug: string | null;
  hasSubmitted: boolean;
  hasVoted: boolean;
  submissionCount: number;
};

export function useMyCompetitionReminders() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<MyCompetitionReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setCompetitions([]);
      setLoading(false);
      return;
    }

    const fetchMine = async () => {
      const { data: parts } = await supabase
        .from("competition_participants")
        .select("competition_id")
        .eq("user_id", user.id);

      const ids = [...new Set((parts || []).map((p) => p.competition_id))];
      if (ids.length === 0) {
        setCompetitions([]);
        setLoading(false);
        return;
      }

      const { data: comps } = await supabase
        .from("competitions")
        .select("id, name, status, deadline, voting_deadline, slug, updated_at")
        .in("id", ids)
        .in("status", ["live", "voting"])
        .order("updated_at", { ascending: false });

      const liveIds = (comps || []).map((c) => c.id);
      if (liveIds.length === 0) {
        setCompetitions([]);
        setLoading(false);
        return;
      }

      const [{ data: mySubs }, { data: votes }, { data: allSubs }] = await Promise.all([
        supabase
          .from("competition_submissions")
          .select("competition_id")
          .eq("user_id", user.id)
          .in("competition_id", liveIds),
        supabase
          .from("competition_votes" as any)
          .select("competition_id")
          .eq("voter_id", user.id)
          .in("competition_id", liveIds),
        supabase
          .from("competition_submissions")
          .select("competition_id")
          .in("competition_id", liveIds),
      ]);

      const submittedIds = new Set((mySubs || []).map((s) => s.competition_id));
      const votedIds = new Set(((votes as any[]) || []).map((v) => v.competition_id));
      const submissionCounts = ((allSubs as any[]) || []).reduce<Record<string, number>>((acc, s) => {
        acc[s.competition_id] = (acc[s.competition_id] || 0) + 1;
        return acc;
      }, {});
      const now = Date.now();
      const shouldFinalize = (comp: any) => {
        const count = submissionCounts[comp.id] || 0;
        const deadline = comp.deadline ? new Date(comp.deadline).getTime() : 0;
        const votingDeadline = comp.voting_deadline ? new Date(comp.voting_deadline).getTime() : 0;
        return (comp.status === "live" && deadline > 0 && deadline <= now) ||
          (comp.status === "voting" && (count <= 1 || !votingDeadline || votingDeadline <= now));
      };
      const staleComps = (comps || []).filter(shouldFinalize);
      if (staleComps.length > 0) {
        await Promise.all(staleComps.map((comp) => supabase.rpc("finalize_competition_if_expired" as any, { p_competition_id: comp.id } as any)));
      }

      setCompetitions(
        (comps || [])
          .filter((comp) => {
            if (shouldFinalize(comp)) return false;
            const endsAt = comp.status === "voting" ? (comp as any).voting_deadline : comp.deadline;
            return true;
          })
          .map((comp) => ({
            id: comp.id,
            name: comp.name,
            status: comp.status,
            deadline: comp.deadline,
            voting_deadline: (comp as any).voting_deadline,
            slug: comp.slug,
            hasSubmitted: submittedIds.has(comp.id),
            hasVoted: votedIds.has(comp.id),
            submissionCount: submissionCounts[comp.id] || 0,
          }))
      );
      setLoading(false);
    };

    fetchMine();
    const poll = window.setInterval(fetchMine, 5000);

    const channel = supabase
      .channel(`my-competition-reminders-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competitions" }, () => fetchMine())
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_participants" }, () => fetchMine())
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_submissions" }, () => fetchMine())
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_votes" }, () => fetchMine())
      .subscribe();

    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return { competitions, hasActiveCompetition: competitions.length > 0, loading };
}