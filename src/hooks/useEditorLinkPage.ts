import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LinkPageSettings {
  id?: string;
  user_id: string;
  page_title: string | null;
  bio: string | null;
  bg_type: string;
  bg_color: string;
  bg_gradient_from: string | null;
  bg_gradient_to: string | null;
  bg_image_url: string | null;
  accent_color: string;
  text_color: string;
  card_style: string;
  show_avatar: boolean;
  show_stats: boolean;
  show_socials: boolean;
  custom_avatar_url: string | null;
  is_published: boolean;
  view_count: number;
}

export interface EditorLink {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  thumbnail_url: string | null;
  link_type: string;
  embed_url: string | null;
  sort_order: number;
  is_active: boolean;
  click_count: number;
}

const defaultSettings: Omit<LinkPageSettings, "user_id"> = {
  page_title: null,
  bio: null,
  bg_type: "solid",
  bg_color: "#0a0a0a",
  bg_gradient_from: null,
  bg_gradient_to: null,
  bg_image_url: null,
  accent_color: "#d4af37",
  text_color: "#ffffff",
  card_style: "default",
  show_avatar: true,
  show_stats: true,
  show_socials: true,
  custom_avatar_url: null,
  is_published: false,
  view_count: 0,
};

const authErrorMessage = (fallback: string, error?: { code?: string; message?: string } | null) => {
  const text = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  if (text.includes("42501") || text.includes("row-level security") || text.includes("jwt") || text.includes("permission denied")) {
    return "Please sign in again to manage your links.";
  }
  return fallback;
};

export function useEditorLinkPage(userId?: string) {
  const [settings, setSettings] = useState<LinkPageSettings | null>(null);
  const [links, setLinks] = useState<EditorLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setLinks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [settingsRes, linksRes] = await Promise.all([
        supabase
          .from("editor_link_pages")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("editor_links")
          .select("*")
          .eq("user_id", userId)
          .order("sort_order", { ascending: true }),
      ]);

      if (settingsRes.error) {
        toast.error(authErrorMessage("Failed to load page settings", settingsRes.error));
      }

      if (linksRes.error) {
        toast.error(authErrorMessage("Failed to load links", linksRes.error));
      }

      if (settingsRes.data) {
        setSettings(settingsRes.data as unknown as LinkPageSettings);
      } else {
        setSettings({ ...defaultSettings, user_id: userId });
      }

      setLinks((linksRes.data as unknown as EditorLink[]) || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveSettings = async (updates: Partial<LinkPageSettings>) => {
    if (!userId) {
      toast.error("Please sign in to edit your link page.");
      return;
    }

    const payload = { ...updates, user_id: userId, updated_at: new Date().toISOString() };

    const { error } = settings?.id
      ? await supabase.from("editor_link_pages").update(payload).eq("id", settings.id)
      : await supabase.from("editor_link_pages").insert(payload);

    if (error) {
      toast.error(authErrorMessage("Failed to save settings", error));
      return;
    }

    await fetchData();
  };

  const addLink = async (link: { title: string; url: string; link_type?: string; embed_url?: string; description?: string }) => {
    if (!userId) {
      toast.error("Please sign in to add links.");
      return;
    }

    const { error } = await supabase.from("editor_links").insert({
      user_id: userId,
      title: link.title,
      url: link.url,
      link_type: link.link_type || "link",
      embed_url: link.embed_url || null,
      description: link.description || null,
      sort_order: links.length,
    });

    if (error) {
      toast.error(authErrorMessage("Failed to add link", error));
      return;
    }

    await fetchData();
  };

  const updateLink = async (linkId: string, updates: Partial<EditorLink>) => {
    if (!userId) {
      toast.error("Please sign in to edit links.");
      return;
    }

    const { error } = await supabase.from("editor_links").update(updates).eq("id", linkId);
    if (error) {
      toast.error(authErrorMessage("Failed to update link", error));
      return;
    }
    await fetchData();
  };

  const removeLink = async (linkId: string) => {
    if (!userId) {
      toast.error("Please sign in to remove links.");
      return;
    }

    const { error } = await supabase.from("editor_links").delete().eq("id", linkId);
    if (error) {
      toast.error(authErrorMessage("Failed to remove link", error));
      return;
    }
    await fetchData();
  };

  const reorderLinks = async (reordered: EditorLink[]) => {
    if (!userId) {
      toast.error("Please sign in to reorder links.");
      return;
    }

    setLinks(reordered);
    const updates = await Promise.all(
      reordered.map((link, i) =>
        supabase.from("editor_links").update({ sort_order: i }).eq("id", link.id)
      )
    );

    const failed = updates.find((res) => res.error);
    if (failed?.error) {
      toast.error(authErrorMessage("Failed to reorder links", failed.error));
      await fetchData();
    }
  };

  return { settings, links, loading, saveSettings, addLink, updateLink, removeLink, reorderLinks, refetch: fetchData };
}
