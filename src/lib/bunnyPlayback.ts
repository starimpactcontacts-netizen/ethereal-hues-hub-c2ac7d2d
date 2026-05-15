const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export function getBunnySourceUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const nested = parsed.searchParams.get("url");
    if (parsed.pathname.includes("/bunny-stream") && nested) return nested;
  } catch {
    return url;
  }

  return url;
}

export function isBunnyVideoUrl(url: string | null | undefined): boolean {
  const source = getBunnySourceUrl(url);
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(source);
}

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