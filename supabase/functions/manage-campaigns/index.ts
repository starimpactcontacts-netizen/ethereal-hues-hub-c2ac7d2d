import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, ...params } = await req.json();

    // ─── GET CAMPAIGNS FOR CLIENT ───
    if (action === "get-campaigns") {
      const { client_id } = params;
      if (!client_id) {
        return new Response(JSON.stringify({ error: "client_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: campaigns, error } = await supabase
        .from("artist_campaigns")
        .select("*")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get edits for each campaign
      const campaignIds = (campaigns || []).map(c => c.id);
      let edits: any[] = [];
      if (campaignIds.length > 0) {
        const { data: editData } = await supabase
          .from("artist_campaign_edits")
          .select("*")
          .in("campaign_id", campaignIds)
          .order("created_at", { ascending: false });
        edits = editData || [];
      }

      return new Response(JSON.stringify({ campaigns: campaigns || [], edits }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── GET ALL CAMPAIGNS (admin) ───
    if (action === "get-all-campaigns") {
      const { data: campaigns, error } = await supabase
        .from("artist_campaigns")
        .select("*, enterprise_clients(email, display_name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const campaignIds = (campaigns || []).map(c => c.id);
      let edits: any[] = [];
      if (campaignIds.length > 0) {
        const { data: editData } = await supabase
          .from("artist_campaign_edits")
          .select("*")
          .in("campaign_id", campaignIds)
          .order("created_at", { ascending: false });
        edits = editData || [];
      }

      return new Response(JSON.stringify({ campaigns: campaigns || [], edits }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── CREATE CAMPAIGN ───
    if (action === "create-campaign") {
      const { client_id, name, description, start_date, end_date, budget_cents, cover_image_url } = params;
      if (!client_id || !name) {
        return new Response(JSON.stringify({ error: "client_id and name required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data, error } = await supabase
        .from("artist_campaigns")
        .insert({ client_id, name, description, start_date, end_date, budget_cents, cover_image_url })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ campaign: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── UPDATE CAMPAIGN STATS ───
    if (action === "update-campaign") {
      const { campaign_id, ...updates } = params;
      if (!campaign_id) {
        return new Response(JSON.stringify({ error: "campaign_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Only allow specific fields
      const allowed = ['name', 'description', 'status', 'total_views', 'total_impressions', 
        'total_engagements', 'total_clicks', 'budget_cents', 'spent_cents', 'roi_percentage',
        'start_date', 'end_date', 'cover_image_url'];
      const filtered: Record<string, any> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) filtered[key] = updates[key];
      }

      const { data, error } = await supabase
        .from("artist_campaigns")
        .update(filtered)
        .eq("id", campaign_id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ campaign: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── ADD EDIT TO CAMPAIGN ───
    if (action === "add-edit") {
      const { campaign_id, title, video_url, thumbnail_url, platform, view_count, like_count, 
        share_count, comment_count, editor_username, published_at } = params;
      if (!campaign_id || !title) {
        return new Response(JSON.stringify({ error: "campaign_id and title required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data, error } = await supabase
        .from("artist_campaign_edits")
        .insert({ 
          campaign_id, title, video_url, thumbnail_url, platform,
          view_count: view_count || 0, like_count: like_count || 0,
          share_count: share_count || 0, comment_count: comment_count || 0,
          editor_username, published_at: published_at || new Date().toISOString(),
          status: 'live'
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ edit: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── UPDATE EDIT STATS ───
    if (action === "update-edit") {
      const { edit_id, ...updates } = params;
      if (!edit_id) {
        return new Response(JSON.stringify({ error: "edit_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const allowed = ['title', 'video_url', 'thumbnail_url', 'platform', 'view_count', 
        'like_count', 'share_count', 'comment_count', 'editor_username', 'status', 'published_at'];
      const filtered: Record<string, any> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) filtered[key] = updates[key];
      }

      const { data, error } = await supabase
        .from("artist_campaign_edits")
        .update(filtered)
        .eq("id", edit_id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ edit: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── DELETE EDIT ───
    if (action === "delete-edit") {
      const { edit_id } = params;
      if (!edit_id) {
        return new Response(JSON.stringify({ error: "edit_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { error } = await supabase
        .from("artist_campaign_edits")
        .delete()
        .eq("id", edit_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── DELETE CAMPAIGN ───
    if (action === "delete-campaign") {
      const { campaign_id } = params;
      if (!campaign_id) {
        return new Response(JSON.stringify({ error: "campaign_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { error } = await supabase
        .from("artist_campaigns")
        .delete()
        .eq("id", campaign_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ─── GET ALL CLIENTS (admin) ───
    if (action === "get-clients") {
      const { data, error } = await supabase
        .from("enterprise_clients")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ clients: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Campaign management error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
