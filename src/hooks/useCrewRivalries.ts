import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CrewRivalry {
  id: string;
  crew_id: string;
  rival_crew_id: string;
  created_at: string;
  created_by: string;
  rival_crew?: {
    id: string;
    name: string;
    avatar_url: string | null;
    member_count: number;
    emblem: string;
  };
}

export function useCrewRivalries(crewId: string | undefined) {
  const [rivalries, setRivalries] = useState<CrewRivalry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRivalries = useCallback(async () => {
    if (!crewId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("crew_rivalries")
      .select("*")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch rival crew details
      const rivalIds = data.map((r) => r.rival_crew_id);
      if (rivalIds.length > 0) {
        const { data: crewsData } = await supabase
          .from("crews")
          .select("id, name, avatar_url, member_count, emblem")
          .in("id", rivalIds);

        const rivalriesWithDetails = data.map((r) => ({
          ...r,
          rival_crew: crewsData?.find((c) => c.id === r.rival_crew_id),
        }));
        setRivalries(rivalriesWithDetails);
      } else {
        setRivalries([]);
      }
    }
    setLoading(false);
  }, [crewId]);

  useEffect(() => {
    fetchRivalries();
  }, [fetchRivalries]);

  // Subscribe to realtime
  useEffect(() => {
    if (!crewId) return;

    const channel = supabase
      .channel(`crew-rivalries-${crewId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crew_rivalries",
          filter: `crew_id=eq.${crewId}`,
        },
        () => {
          fetchRivalries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId, fetchRivalries]);

  const addRival = useCallback(
    async (rivalCrewId: string, userId: string) => {
      if (!crewId) return false;

      // Check if already a rival
      if (rivalries.some((r) => r.rival_crew_id === rivalCrewId)) {
        toast.error("Already marked as rival!");
        return false;
      }

      const { error } = await supabase.from("crew_rivalries").insert({
        crew_id: crewId,
        rival_crew_id: rivalCrewId,
        created_by: userId,
      });

      if (error) {
        toast.error("Failed to add rival");
        return false;
      }

      toast.success("⚔️ Rival marked! Let the competition begin.");
      fetchRivalries();
      return true;
    },
    [crewId, rivalries, fetchRivalries]
  );

  const removeRival = useCallback(
    async (rivalryId: string) => {
      const { error } = await supabase
        .from("crew_rivalries")
        .delete()
        .eq("id", rivalryId);

      if (error) {
        toast.error("Failed to remove rival");
        return false;
      }

      toast.success("Rivalry ended");
      fetchRivalries();
      return true;
    },
    [fetchRivalries]
  );

  return {
    rivalries,
    loading,
    addRival,
    removeRival,
    refresh: fetchRivalries,
  };
}
