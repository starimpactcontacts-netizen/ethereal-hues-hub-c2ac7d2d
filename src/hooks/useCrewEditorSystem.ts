import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface EditorTier {
  id: string;
  crew_id: string;
  name: string;
  description: string | null;
  tier_order: number;
  color: string;
  icon: string;
  perks: string[];
  requirements: string | null;
  application_url: string | null;
  created_at: string;
}

export interface EditorApplication {
  id: string;
  crew_id: string;
  tier_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  tier?: EditorTier;
}

export interface CrewEditor {
  id: string;
  crew_id: string;
  user_id: string;
  tier_id: string;
  approved_by: string | null;
  approved_at: string;
  tier?: EditorTier;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CrewAsset {
  id: string;
  crew_id: string;
  name: string;
  asset_type: "logo" | "pfp" | "overlay" | "banner";
  asset_url: string;
  min_tier_order: number;
  description: string | null;
  created_at: string;
}

export function useCrewEditorSystem(crewId: string | undefined) {
  const { user, profile } = useAuth();
  const [tiers, setTiers] = useState<EditorTier[]>([]);
  const [applications, setApplications] = useState<EditorApplication[]>([]);
  const [editors, setEditors] = useState<CrewEditor[]>([]);
  const [assets, setAssets] = useState<CrewAsset[]>([]);
  const [myEditorStatus, setMyEditorStatus] = useState<CrewEditor | null>(null);
  const [myApplications, setMyApplications] = useState<EditorApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!crewId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch tiers
    const { data: tiersData } = await supabase
      .from("crew_editor_tiers")
      .select("*")
      .eq("crew_id", crewId)
      .order("tier_order", { ascending: true });

    if (tiersData) {
      setTiers(tiersData.map(t => ({
        ...t,
        perks: Array.isArray(t.perks) ? t.perks : []
      })) as EditorTier[]);
    }

    // Fetch editors with profiles
    const { data: editorsData } = await supabase
      .from("crew_editors")
      .select("*")
      .eq("crew_id", crewId);

    if (editorsData && editorsData.length > 0) {
      // Fetch profile info for each editor
      const userIds = editorsData.map(e => e.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);

      const editorsWithProfiles = editorsData.map(e => ({
        ...e,
        tier: tiersData?.find(t => t.id === e.tier_id),
        profile: profilesData?.find(p => p.id === e.user_id)
      }));

      setEditors(editorsWithProfiles as CrewEditor[]);

      // Check if current user is an editor
      if (user) {
        const myStatus = editorsWithProfiles.find(e => e.user_id === user.id);
        setMyEditorStatus(myStatus as CrewEditor || null);
      }
    } else {
      setEditors([]);
      setMyEditorStatus(null);
    }

    // Fetch user's own applications
    if (user) {
      const { data: myAppsData } = await supabase
        .from("crew_editor_applications")
        .select("*")
        .eq("crew_id", crewId)
        .eq("user_id", user.id);

      if (myAppsData) {
        setMyApplications(myAppsData.map(a => ({
          ...a,
          tier: tiersData?.find(t => t.id === a.tier_id)
        })) as EditorApplication[]);
      }
    }

    // Fetch assets user can access
    const { data: assetsData } = await supabase
      .from("crew_assets")
      .select("*")
      .eq("crew_id", crewId);

    if (assetsData) {
      setAssets(assetsData as CrewAsset[]);
    }

    setLoading(false);
  }, [crewId, user]);

  // Fetch applications (for officers)
  const fetchApplications = useCallback(async () => {
    if (!crewId) return;

    const { data } = await supabase
      .from("crew_editor_applications")
      .select("*")
      .eq("crew_id", crewId)
      .order("created_at", { ascending: false });

    if (data) {
      setApplications(data.map(a => ({
        ...a,
        tier: tiers.find(t => t.id === a.tier_id)
      })) as EditorApplication[]);
    }
  }, [crewId, tiers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (tiers.length > 0) {
      fetchApplications();
    }
  }, [tiers, fetchApplications]);

  // Create a tier
  const createTier = useCallback(async (tier: Partial<EditorTier>) => {
    if (!crewId) return null;

    const { data, error } = await supabase
      .from("crew_editor_tiers")
      .insert({
        crew_id: crewId,
        name: tier.name || "New Tier",
        description: tier.description,
        tier_order: tier.tier_order || tiers.length + 1,
        color: tier.color || "#FFD700",
        icon: tier.icon || "⭐",
        perks: tier.perks || [],
        requirements: tier.requirements,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create tier");
      return null;
    }

    toast.success("Tier created!");
    fetchData();
    return data;
  }, [crewId, tiers.length, fetchData]);

  // Update a tier
  const updateTier = useCallback(async (tierId: string, updates: Partial<EditorTier>) => {
    const { error } = await supabase
      .from("crew_editor_tiers")
      .update({
        name: updates.name,
        description: updates.description,
        tier_order: updates.tier_order,
        color: updates.color,
        icon: updates.icon,
        perks: updates.perks,
        requirements: updates.requirements,
      })
      .eq("id", tierId);

    if (error) {
      toast.error("Failed to update tier");
      return false;
    }

    toast.success("Tier updated!");
    fetchData();
    return true;
  }, [fetchData]);

  // Delete a tier
  const deleteTier = useCallback(async (tierId: string) => {
    const { error } = await supabase
      .from("crew_editor_tiers")
      .delete()
      .eq("id", tierId);

    if (error) {
      toast.error("Failed to delete tier");
      return false;
    }

    toast.success("Tier deleted");
    fetchData();
    return true;
  }, [fetchData]);

  // Submit an application
  const submitApplication = useCallback(async (
    tierId: string,
    submissionUrl: string,
    platform: string,
    message?: string
  ) => {
    if (!crewId || !user || !profile) {
      toast.error("Please log in to apply");
      return null;
    }

    // Check if already applied for this tier
    const existingApp = myApplications.find(a => a.tier_id === tierId && a.status === "pending");
    if (existingApp) {
      toast.error("You already have a pending application for this tier");
      return null;
    }

    const { data, error } = await supabase
      .from("crew_editor_applications")
      .insert({
        crew_id: crewId,
        tier_id: tierId,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        submission_url: submissionUrl,
        platform,
        message,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to submit application");
      return null;
    }

    toast.success("Application submitted! 🎉");
    fetchData();
    return data;
  }, [crewId, user, profile, myApplications, fetchData]);

  // Review an application
  const reviewApplication = useCallback(async (
    applicationId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    if (!user) return false;

    const { error } = await supabase
      .from("crew_editor_applications")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes,
      })
      .eq("id", applicationId);

    if (error) {
      toast.error("Failed to update application");
      return false;
    }

    // If approved, add to editors
    if (status === "approved") {
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        const { error: editorError } = await supabase
          .from("crew_editors")
          .upsert({
            crew_id: app.crew_id,
            user_id: app.user_id,
            tier_id: app.tier_id,
            approved_by: user.id,
          }, { onConflict: "crew_id,user_id" });

        if (editorError) {
          console.error("Error adding editor:", editorError);
        }
      }
    }

    toast.success(status === "approved" ? "Application approved! 🎉" : "Application rejected");
    fetchData();
    fetchApplications();
    return true;
  }, [user, applications, fetchData, fetchApplications]);

  // Remove an editor
  const removeEditor = useCallback(async (editorId: string) => {
    const { error } = await supabase
      .from("crew_editors")
      .delete()
      .eq("id", editorId);

    if (error) {
      toast.error("Failed to remove editor");
      return false;
    }

    toast.success("Editor removed");
    fetchData();
    return true;
  }, [fetchData]);

  // Promote/demote editor tier
  const changeEditorTier = useCallback(async (editorId: string, newTierId: string) => {
    const { error } = await supabase
      .from("crew_editors")
      .update({ tier_id: newTierId })
      .eq("id", editorId);

    if (error) {
      toast.error("Failed to change tier");
      return false;
    }

    toast.success("Editor tier updated!");
    fetchData();
    return true;
  }, [fetchData]);

  // Add an asset
  const addAsset = useCallback(async (asset: Partial<CrewAsset>) => {
    if (!crewId) return null;

    const { data, error } = await supabase
      .from("crew_assets")
      .insert({
        crew_id: crewId,
        name: asset.name || "New Asset",
        asset_type: asset.asset_type || "logo",
        asset_url: asset.asset_url || "",
        min_tier_order: asset.min_tier_order || 0,
        description: asset.description,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add asset");
      return null;
    }

    toast.success("Asset added!");
    fetchData();
    return data;
  }, [crewId, fetchData]);

  // Delete an asset
  const deleteAsset = useCallback(async (assetId: string) => {
    const { error } = await supabase
      .from("crew_assets")
      .delete()
      .eq("id", assetId);

    if (error) {
      toast.error("Failed to delete asset");
      return false;
    }

    toast.success("Asset deleted");
    fetchData();
    return true;
  }, [fetchData]);

  return {
    tiers,
    applications,
    editors,
    assets,
    myEditorStatus,
    myApplications,
    loading,
    createTier,
    updateTier,
    deleteTier,
    submitApplication,
    reviewApplication,
    removeEditor,
    changeEditorTier,
    addAsset,
    deleteAsset,
    refresh: fetchData,
  };
}
