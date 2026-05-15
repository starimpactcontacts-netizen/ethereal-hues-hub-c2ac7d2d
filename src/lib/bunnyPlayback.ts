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

/** True for any URL we can play in our <video> / HLS pipeline. */
export function isBunnyVideoUrl(url: string | null | undefined): boolean {
  const source = getBunnySourceUrl(url);
  return /\.(mp4|webm|mov|m4v|m3u8)(\?|$)/i.test(source);
}

/** True for HLS (Bunny Stream) playlists — these need hls.js outside Safari. */
export function isHlsUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.m3u8(\?|$)/i.test(url);
}

export function getBunnyPlaybackUrl(url: string | null | undefined): string {
  if (!url) return "";
  const source = getBunnySourceUrl(url);

  try {
    const parsed = new URL(source);
    // Bunny Stream HLS / MP4 fallbacks are served straight from Bunny CDN.
    // Do NOT route video playback through Lovable Cloud; that would burn backend bandwidth.
    if (parsed.hostname.endsWith('.b-cdn.net')) return source;
    if (parsed.hostname === "storage.bunnycdn.com") {
      console.warn('[Bunny Video] Legacy Bunny Storage URL detected; refusing Lovable proxy playback:', source);
      return source;
    }
  } catch {
    return source;
  }

  return source;
}