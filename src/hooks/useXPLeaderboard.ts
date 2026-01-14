import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface XPUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  rank?: number;
}

export interface XPCrew {
  id: string;
  name: string;
  avatar_url: string | null;
  emblem: string;
  member_count: number;
  totalXP: number;
  crewLevel: number;
  rank?: number;
}

// Calculate crew level based on XP (10x user thresholds)
function calculateCrewLevel(xp: number): number {
  if (xp >= 70000) return 10;
  if (xp >= 45000) return 9;
  if (xp >= 32000) return 8;
  if (xp >= 22000) return 7;
  if (xp >= 15000) return 6;
  if (xp >= 10000) return 5;
  if (xp >= 6000) return 4;
  if (xp >= 3000) return 3;
  if (xp >= 1000) return 2;
  return 1;
}

export function useXPUserLeaderboard(limit: number = 50) {
  const [users, setUsers] = useState<XPUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, xp, level")
      .eq("is_hidden", false)
      .gt("xp", 0)
      .order("xp", { ascending: false })
      .limit(limit);

    if (!error && data) {
      const ranked = data.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
      setUsers(ranked);
    }

    setLoading(false);
  };

  return { users, loading, refresh: fetchLeaderboard };
}

export function useXPCrewLeaderboard(limit: number = 50) {
  const [crews, setCrews] = useState<XPCrew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);

    // Fetch all crews
    const { data: crewsData, error: crewsError } = await supabase
      .from("crews")
      .select("id, name, avatar_url, emblem, member_count")
      .gt("member_count", 0);

    if (crewsError || !crewsData) {
      setLoading(false);
      return;
    }

    // For each crew, calculate total XP
    const crewsWithXP = await Promise.all(
      crewsData.map(async (crew) => {
        // Get all members' XP
        const { data: members } = await supabase
          .from("crew_members")
          .select("user_id")
          .eq("crew_id", crew.id);

        if (!members || members.length === 0) {
          return { ...crew, totalXP: 0, crewLevel: 1 };
        }

        const memberIds = members.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("xp")
          .in("id", memberIds);

        const totalXP = profiles?.reduce((sum, p) => sum + (p.xp || 0), 0) || 0;
        const crewLevel = calculateCrewLevel(totalXP);

        return { ...crew, totalXP, crewLevel };
      })
    );

    // Sort by XP and add ranks
    const sorted = crewsWithXP
      .sort((a, b) => b.totalXP - a.totalXP)
      .slice(0, limit)
      .map((crew, index) => ({
        ...crew,
        rank: index + 1,
      }));

    setCrews(sorted);
    setLoading(false);
  };

  return { crews, loading, refresh: fetchLeaderboard };
}
