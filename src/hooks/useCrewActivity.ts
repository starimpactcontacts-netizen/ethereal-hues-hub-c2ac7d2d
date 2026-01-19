import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CrewActivityItem {
  id: string;
  crew_id: string;
  user_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  join: "👋",
  submission: "🎬",
  level_up: "⬆️",
  rank_change: "🏆",
  achievement: "🏅",
  xp_earned: "✨",
  arena_win: "🥇",
  gqt_score: "📊",
  new_member: "🎉",
};

export function useCrewActivity(crewId: string | undefined) {
  const [activities, setActivities] = useState<CrewActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!crewId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("crew_activity")
      .select("*")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setActivities(data as CrewActivityItem[]);
    }
    setLoading(false);
  }, [crewId]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!crewId) return;

    const channel = supabase
      .channel(`crew-activity-${crewId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crew_activity",
          filter: `crew_id=eq.${crewId}`,
        },
        (payload) => {
          const newActivity = payload.new as CrewActivityItem;
          setActivities((prev) => [newActivity, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId]);

  return {
    activities,
    loading,
    refresh: fetchActivities,
    getIcon: (type: string) => ACTIVITY_ICONS[type] || "📌",
  };
}

// Helper to create activity entries (called from various places)
export async function createCrewActivity(
  crewId: string,
  userId: string | null,
  activityType: string,
  title: string,
  description?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
) {
  const insertData = {
    crew_id: crewId,
    user_id: userId,
    activity_type: activityType,
    title,
    description: description || null,
    data: data || {},
  };
  
  const { error } = await supabase.from("crew_activity").insert(insertData);

  return !error;
}
