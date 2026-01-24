import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CrewMembership {
  id: string;
  crew_id: string;
  user_id: string;
  role: "owner" | "officer" | "member";
  is_primary: boolean;
  joined_at: string;
  crew?: {
    id: string;
    name: string;
    emblem: string;
    avatar_url: string | null;
    member_count: number;
  };
}

const PRIMARY_COOLDOWN_DAYS = 7;

export function useCrewMembership(userId: string | undefined) {
  const [memberships, setMemberships] = useState<CrewMembership[]>([]);
  const [primaryCrew, setPrimaryCrew] = useState<CrewMembership | null>(null);
  const [secondaryCrews, setSecondaryCrews] = useState<CrewMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<Date | null>(null);

  const fetchMemberships = useCallback(async () => {
    if (!userId) {
      setMemberships([]);
      setPrimaryCrew(null);
      setSecondaryCrews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch memberships with crew details
    const { data: membershipData, error } = await supabase
      .from("crew_members")
      .select(`
        id,
        crew_id,
        user_id,
        role,
        is_primary,
        joined_at
      `)
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching crew memberships:", error);
      setLoading(false);
      return;
    }

    if (membershipData && membershipData.length > 0) {
      // Fetch crew details for each membership
      const crewIds = membershipData.map((m) => m.crew_id);
      const { data: crewsData } = await supabase
        .from("crews")
        .select("id, name, emblem, avatar_url, member_count")
        .in("id", crewIds);

      const membershipsWithCrews = membershipData.map((m) => ({
        ...m,
        role: m.role as "owner" | "officer" | "member",
        crew: crewsData?.find((c) => c.id === m.crew_id),
      }));

      setMemberships(membershipsWithCrews);
      setPrimaryCrew(membershipsWithCrews.find((m) => m.is_primary) || null);
      setSecondaryCrews(membershipsWithCrews.filter((m) => !m.is_primary));
    } else {
      setMemberships([]);
      setPrimaryCrew(null);
      setSecondaryCrews([]);
    }

    // Fetch cooldown info from profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("primary_crew_changed_at")
      .eq("id", userId)
      .single();

    if (profileData?.primary_crew_changed_at) {
      const changedAt = new Date(profileData.primary_crew_changed_at);
      const cooldownEnd = new Date(changedAt.getTime() + PRIMARY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      if (cooldownEnd > new Date()) {
        setCooldownEndsAt(cooldownEnd);
      } else {
        setCooldownEndsAt(null);
      }
    } else {
      setCooldownEndsAt(null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  // Check if user can have more secondary crews (max 3)
  const canJoinSecondary = secondaryCrews.length < 3;

  // Check if user can change primary crew (not on cooldown)
  const canChangePrimary = cooldownEndsAt === null || cooldownEndsAt <= new Date();

  // Set a crew as primary
  const setPrimaryCrewById = useCallback(
    async (crewId: string) => {
      if (!userId) return false;

      // Check cooldown
      if (!canChangePrimary) {
        toast.error(`You can change your primary crew on ${cooldownEndsAt?.toLocaleDateString()}`);
        return false;
      }

      // Find the membership
      const membership = memberships.find((m) => m.crew_id === crewId);
      if (!membership) {
        toast.error("You're not a member of this crew");
        return false;
      }

      // If already primary, nothing to do
      if (membership.is_primary) {
        toast.info("This is already your primary crew");
        return true;
      }

      // Start transaction-like updates
      // 1. Set current primary to secondary
      if (primaryCrew) {
        const { error: unsetError } = await supabase
          .from("crew_members")
          .update({ is_primary: false })
          .eq("id", primaryCrew.id);

        if (unsetError) {
          console.error("Error unsetting primary crew:", unsetError);
          toast.error("Failed to change primary crew");
          return false;
        }
      }

      // 2. Set new primary
      const { error: setError } = await supabase
        .from("crew_members")
        .update({ is_primary: true })
        .eq("id", membership.id);

      if (setError) {
        console.error("Error setting primary crew:", setError);
        toast.error("Failed to set primary crew");
        // Try to revert
        if (primaryCrew) {
          await supabase.from("crew_members").update({ is_primary: true }).eq("id", primaryCrew.id);
        }
        return false;
      }

      // 3. Update profile with crew_id and cooldown timestamp
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          crew_id: crewId,
          primary_crew_changed_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }

      toast.success(`🏴 ${membership.crew?.name} is now your primary crew!`);
      fetchMemberships();
      return true;
    },
    [userId, memberships, primaryCrew, canChangePrimary, cooldownEndsAt, fetchMemberships]
  );

  // Join a crew as secondary
  const joinAsSecondary = useCallback(
    async (crewId: string) => {
      if (!userId) return false;

      if (!canJoinSecondary) {
        toast.error("You can only have 3 secondary crews. Leave one first.");
        return false;
      }

      // Check if already a member
      if (memberships.some((m) => m.crew_id === crewId)) {
        toast.error("You're already a member of this crew");
        return false;
      }

      const { error } = await supabase.from("crew_members").insert({
        crew_id: crewId,
        user_id: userId,
        role: "member",
        is_primary: false,
      });

      if (error) {
        console.error("Error joining crew as secondary:", error);
        toast.error("Failed to join crew");
        return false;
      }

      toast.success("Joined as secondary crew!");
      fetchMemberships();
      return true;
    },
    [userId, memberships, canJoinSecondary, fetchMemberships]
  );

  // Leave a secondary crew
  const leaveSecondary = useCallback(
    async (crewId: string) => {
      if (!userId) return false;

      const membership = secondaryCrews.find((m) => m.crew_id === crewId);
      if (!membership) {
        toast.error("You're not a secondary member of this crew");
        return false;
      }

      // Cannot leave if you're the owner
      if (membership.role === "owner") {
        toast.error("Owners cannot leave. Transfer ownership first.");
        return false;
      }

      const { error } = await supabase
        .from("crew_members")
        .delete()
        .eq("id", membership.id);

      if (error) {
        console.error("Error leaving crew:", error);
        toast.error("Failed to leave crew");
        return false;
      }

      toast.success("Left secondary crew");
      fetchMemberships();
      return true;
    },
    [userId, secondaryCrews, fetchMemberships]
  );

  return {
    memberships,
    primaryCrew,
    secondaryCrews,
    loading,
    cooldownEndsAt,
    canJoinSecondary,
    canChangePrimary,
    setPrimaryCrewById,
    joinAsSecondary,
    leaveSecondary,
    refresh: fetchMemberships,
  };
}
