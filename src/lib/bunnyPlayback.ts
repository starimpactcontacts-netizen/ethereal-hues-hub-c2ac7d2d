const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function getBunnyPlaybackUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    if (parsed.hostname === "storage.bunnycdn.com") {
      return `${FUNCTIONS_BASE}/bunny-stream?url=${encodeURIComponent(url)}`;
    }
  } catch {
    return url;
  }

  return url;
}