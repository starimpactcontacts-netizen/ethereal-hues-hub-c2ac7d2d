import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return saltHex + ':' + hashHex;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, storedHash] = hash.split(':');
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

    // ─── PUBLIC: AUTHENTICATE CAMPAIGN BY SLUG + PASSWORD ───
    if (action === "authenticate-campaign") {
      const { slug, password } = params;
      if (!slug || !password) return jsonRes({ error: "slug and password required" }, 400);

      const { data: campaign, error } = await supabase
        .from("artist_campaigns")
        .select("id, slug, password_hash")
        .eq("slug", slug)
        .single();

      if (error || !campaign) return jsonRes({ error: "Campaign not found" }, 404);
      if (!campaign.password_hash) return jsonRes({ error: "Campaign access not configured" }, 403);

      const valid = await verifyPassword(password, campaign.password_hash);
      if (!valid) return jsonRes({ error: "Invalid password" }, 401);

      return jsonRes({ authenticated: true, campaign_id: campaign.id });
    }

    // ─── PUBLIC: GET CAMPAIGN DATA (after auth, by slug) ───
    if (action === "get-campaign-public") {
      const { slug } = params;
      if (!slug) return jsonRes({ error: "slug required" }, 400);

      const { data: campaign, error } = await supabase
        .from("artist_campaigns")
        .select("id, name, description, status, total_views, total_impressions, total_engagements, total_clicks, budget_cents, spent_cents, roi_percentage, goal_views, goal_label, goal_posts, start_date, end_date, cover_image_url, slug, featured_artist_id, client_name, incoming_note, campaign_type, logo_url")
        .eq("slug", slug)
        .single();

      if (error || !campaign) return jsonRes({ error: "Campaign not found" }, 404);

      // Fetch featured artist if linked
      let artist = null;
      if (campaign.featured_artist_id) {
        const { data: a } = await supabase
          .from("featured_artists")
          .select("id, name, slug, bio, avatar_url, banner_url, genre, social_links, monthly_streams, achievements, website_url, verified")
          .eq("id", campaign.featured_artist_id)
          .single();
        artist = a;
      }

      // Fetch edits
      const { data: edits } = await supabase
        .from("artist_campaign_edits")
        .select("id, title, video_url, thumbnail_url, platform, view_count, like_count, share_count, comment_count, editor_username, status, published_at")
        .eq("campaign_id", campaign.id)
        .order("created_at", { ascending: false });

      return jsonRes({ campaign, artist, edits: edits || [] });
    }

    // ─── GET CAMPAIGNS FOR CLIENT ───
    if (action === "get-campaigns") {
      const { client_id } = params;
      if (!client_id) return jsonRes({ error: "client_id required" }, 400);

      const { data: campaigns, error } = await supabase
        .from("artist_campaigns")
        .select("*")
        .eq("client_id", client_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const campaignIds = (campaigns || []).map((c: any) => c.id);
      let edits: any[] = [];
      if (campaignIds.length > 0) {
        const { data: editData } = await supabase
          .from("artist_campaign_edits")
          .select("*")
          .in("campaign_id", campaignIds)
          .order("created_at", { ascending: false });
        edits = editData || [];
      }

      return jsonRes({ campaigns: campaigns || [], edits });
    }

    // ─── GET ALL CAMPAIGNS (admin) ───
    if (action === "get-all-campaigns") {
      const { data: campaigns, error } = await supabase
        .from("artist_campaigns")
        .select("*, enterprise_clients(email, display_name), featured_artists(name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const campaignIds = (campaigns || []).map((c: any) => c.id);
      let edits: any[] = [];
      if (campaignIds.length > 0) {
        const { data: editData } = await supabase
          .from("artist_campaign_edits")
          .select("*")
          .in("campaign_id", campaignIds)
          .order("created_at", { ascending: false });
        edits = editData || [];
      }

      return jsonRes({ campaigns: campaigns || [], edits });
    }

    // ─── CREATE CAMPAIGN ───
    if (action === "create-campaign") {
      const { client_id, client_name, name, description, start_date, end_date, budget_cents, cover_image_url, goal_views, goal_label, goal_posts, featured_artist_id, password, campaign_type, logo_url } = params;
      if (!name) return jsonRes({ error: "name required" }, 400);

      // Resolve client_id: use provided or find/create by client_name
      let resolved_client_id = client_id;
      if (!resolved_client_id && client_name) {
        // Try to find existing client by display_name
        const { data: existing } = await supabase
          .from("enterprise_clients")
          .select("id")
          .ilike("display_name", client_name)
          .limit(1)
          .single();
        
        if (existing) {
          resolved_client_id = existing.id;
        } else {
          // Create a new client with just a display name
          const { data: created, error: createErr } = await supabase
            .from("enterprise_clients")
            .insert({ display_name: client_name, email: client_name.toLowerCase().replace(/\s+/g, '.') + '@client.loopgate' })
            .select("id")
            .single();
          if (createErr) throw createErr;
          resolved_client_id = created.id;
        }
      }

      if (!resolved_client_id) return jsonRes({ error: "client_name or client_id required" }, 400);

      let password_hash = null;
      if (password && password.length >= 4) {
        password_hash = await hashPassword(password);
      }

      const { data, error } = await supabase
        .from("artist_campaigns")
        .insert({ 
          client_id: resolved_client_id, name, description, start_date, end_date, budget_cents, cover_image_url, 
          goal_views: goal_views || 0, goal_label, goal_posts: goal_posts || 0,
          featured_artist_id: featured_artist_id || null,
          client_name: client_name || null,
          password_hash,
          campaign_type: campaign_type || 'artist',
          logo_url: logo_url || null
        })
        .select("*, featured_artists(name, avatar_url)")
        .single();

      if (error) throw error;
      return jsonRes({ campaign: data });
    }

    // ─── UPDATE CAMPAIGN STATS ───
    if (action === "update-campaign") {
      const { campaign_id, password, ...updates } = params;
      if (!campaign_id) return jsonRes({ error: "campaign_id required" }, 400);

      const allowed = ['name', 'description', 'status', 'total_views', 'total_impressions', 
        'total_engagements', 'total_clicks', 'budget_cents', 'spent_cents', 'roi_percentage',
        'start_date', 'end_date', 'cover_image_url', 'goal_views', 'goal_label', 'goal_posts', 'featured_artist_id', 'client_name', 'incoming_note', 'campaign_type', 'logo_url'];
      const filtered: Record<string, any> = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) filtered[key] = updates[key];
      }

      // Handle password update
      if (password !== undefined) {
        if (password === '') {
          filtered.password_hash = null;
        } else if (password.length >= 4) {
          filtered.password_hash = await hashPassword(password);
        }
      }

      const { data, error } = await supabase
        .from("artist_campaigns")
        .update(filtered)
        .eq("id", campaign_id)
        .select("*, featured_artists(name, avatar_url)")
        .single();

      if (error) throw error;
      return jsonRes({ campaign: data });
    }

    // ─── ADD EDIT TO CAMPAIGN ───
    if (action === "add-edit") {
      const { campaign_id, title, video_url, thumbnail_url, platform, view_count, like_count, 
        share_count, comment_count, editor_username, published_at } = params;
      if (!campaign_id || !title) return jsonRes({ error: "campaign_id and title required" }, 400);

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
      return jsonRes({ edit: data });
    }

    // ─── UPDATE EDIT STATS ───
    if (action === "update-edit") {
      const { edit_id, ...updates } = params;
      if (!edit_id) return jsonRes({ error: "edit_id required" }, 400);

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
      return jsonRes({ edit: data });
    }

    // ─── DELETE EDIT ───
    if (action === "delete-edit") {
      const { edit_id } = params;
      if (!edit_id) return jsonRes({ error: "edit_id required" }, 400);

      const { error } = await supabase.from("artist_campaign_edits").delete().eq("id", edit_id);
      if (error) throw error;
      return jsonRes({ success: true });
    }

    // ─── DELETE CAMPAIGN ───
    if (action === "delete-campaign") {
      const { campaign_id } = params;
      if (!campaign_id) return jsonRes({ error: "campaign_id required" }, 400);

      const { error } = await supabase.from("artist_campaigns").delete().eq("id", campaign_id);
      if (error) throw error;
      return jsonRes({ success: true });
    }

    // ─── GET ALL CLIENTS (admin) ───
    if (action === "get-clients") {
      const { data, error } = await supabase
        .from("enterprise_clients")
        .select("id, email, display_name, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return jsonRes({ clients: data || [] });
    }

    // ─── ADMIN: SET CLIENT PASSWORD ───
    if (action === "set-client-password") {
      const { client_id, new_password } = params;
      if (!client_id || !new_password || new_password.length < 6) {
        return jsonRes({ error: "client_id and password (min 6 chars) required" }, 400);
      }

      const hashed = await hashPassword(new_password);
      const { error } = await supabase
        .from("enterprise_clients")
        .update({ password_hash: hashed })
        .eq("id", client_id);

      if (error) throw error;
      return jsonRes({ success: true });
    }

    // ─── CLIENT: REQUEST DASHBOARD UPDATE ───
    if (action === "request-update") {
      const { client_id, campaign_id, message } = params;
      if (!client_id) return jsonRes({ error: "client_id required" }, 400);

      const { data, error } = await supabase
        .from("dashboard_update_requests")
        .insert({ client_id, campaign_id: campaign_id || null, message: message || 'Please update my dashboard metrics' })
        .select()
        .single();

      if (error) throw error;
      return jsonRes({ success: true, request: data });
    }

    // ─── ADMIN: GET UPDATE REQUESTS ───
    if (action === "get-update-requests") {
      const { data, error } = await supabase
        .from("dashboard_update_requests")
        .select("*, enterprise_clients(email, display_name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return jsonRes({ requests: data || [] });
    }

    // ─── ADMIN: RESOLVE UPDATE REQUEST ───
    if (action === "resolve-request") {
      const { request_id } = params;
      if (!request_id) return jsonRes({ error: "request_id required" }, 400);

      const { error } = await supabase
        .from("dashboard_update_requests")
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq("id", request_id);

      if (error) throw error;
      return jsonRes({ success: true });
    }

    // ─── ADMIN: GET FEATURED ARTISTS LIST (for dropdown) ───
    if (action === "get-featured-artists") {
      const { data, error } = await supabase
        .from("featured_artists")
        .select("id, name, slug, avatar_url, genre, verified")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return jsonRes({ artists: data || [] });
    }

    // ─── GET CLIENT NAME SUGGESTIONS ───
    if (action === "get-client-names") {
      const { data, error } = await supabase
        .from("enterprise_clients")
        .select("id, display_name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Also get unique client_names from campaigns
      const { data: campaignNames } = await supabase
        .from("artist_campaigns")
        .select("client_name, client_id")
        .not("client_name", "is", null);

      const names = new Set<string>();
      (data || []).forEach((c: any) => { if (c.display_name) names.add(c.display_name); });
      (campaignNames || []).forEach((c: any) => { if (c.client_name) names.add(c.client_name); });

      return jsonRes({ names: Array.from(names) });
    }

    return jsonRes({ error: "Unknown action" }, 400);

  } catch (err) {
    console.error("Campaign management error:", err);
    return jsonRes({ error: (err as Error).message || "Internal error" }, 500);
  }
});
