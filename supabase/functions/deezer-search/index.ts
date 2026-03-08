import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type DeezerTrack = {
  id?: number;
  preview?: string | null;
};

type DeezerResponse = {
  data?: DeezerTrack[];
  total?: number;
};

const clampLimit = (value: unknown, fallback = 25) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.floor(n)));
};

const hasPreview = (track: DeezerTrack) => typeof track?.preview === "string" && track.preview.length > 0;

const fetchDeezerJson = async (url: string): Promise<DeezerResponse> => {
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "loopgate-radio/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Deezer API failed [${res.status}]`);
  }

  return await res.json();
};

const fetchEditorialTracks = async (limit: number): Promise<DeezerTrack[]> => {
  const chart = await fetchDeezerJson(`https://api.deezer.com/chart/0/tracks?limit=${limit}`);
  const tracks = Array.isArray(chart.data) ? chart.data.filter(hasPreview) : [];

  if (tracks.length > 0) {
    return tracks.slice(0, limit);
  }

  const fallback = await fetchDeezerJson(`https://api.deezer.com/search/track?q=${encodeURIComponent("top hits")}&limit=${limit}`);
  return Array.isArray(fallback.data) ? fallback.data.filter(hasPreview).slice(0, limit) : [];
};

const searchTracks = async (query: string, limit: number): Promise<DeezerTrack[]> => {
  const pageSize = 25;
  const maxAttempts = 5;
  const seen = new Set<number>();
  const collected: DeezerTrack[] = [];

  let index = 0;
  let attempts = 0;
  let total = Number.POSITIVE_INFINITY;

  while (collected.length < limit && attempts < maxAttempts && index < total) {
    const url = `https://api.deezer.com/search/track?q=${encodeURIComponent(query)}&limit=${pageSize}&index=${index}`;
    const payload = await fetchDeezerJson(url);
    const tracks = Array.isArray(payload.data) ? payload.data : [];

    total = typeof payload.total === "number" ? payload.total : total;

    for (const track of tracks) {
      if (!hasPreview(track) || typeof track.id !== "number" || seen.has(track.id)) continue;
      seen.add(track.id);
      collected.push(track);
      if (collected.length >= limit) break;
    }

    if (tracks.length === 0) break;
    index += pageSize;
    attempts += 1;
  }

  return collected.slice(0, limit);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const limit = clampLimit(body?.limit, 25);

    const data = query ? await searchTracks(query, limit) : await fetchEditorialTracks(limit);

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Deezer search error:", err);
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

