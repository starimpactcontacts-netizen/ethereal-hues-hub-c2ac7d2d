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

export function getBunnyStreamMp4Url(url: string | null | undefined): string {
  const source = getBunnySourceUrl(url);
  if (!source) return "";

  try {
    const parsed = new URL(source);
    if (parsed.hostname.endsWith('.b-cdn.net') && /\/playlist\.m3u8$/i.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/\/playlist\.m3u8$/i, '/play_480p.mp4');
      parsed.search = '';
      return parsed.toString();
    }
  } catch {
    return source;
  }

  return source;
}

export function getBunnyPlaybackCandidates(url: string | null | undefined): string[] {
  const source = getBunnySourceUrl(url);
  if (!source) return [];

  const urls = new Set<string>();
  const add = (candidate: string) => {
    if (candidate) urls.add(candidate);
  };

  add(source);

  try {
    const parsed = new URL(source);
    if (parsed.hostname.endsWith('.b-cdn.net')) {
      const base = new URL(source);
      if (/\/playlist\.m3u8$/i.test(base.pathname)) {
        for (const quality of ['720', '480', '360', '240']) {
          const mp4 = new URL(source);
          mp4.pathname = mp4.pathname.replace(/\/playlist\.m3u8$/i, `/play_${quality}p.mp4`);
          mp4.search = '';
          add(mp4.toString());
        }
      }
      if (/\/play_\d+p\.mp4$/i.test(base.pathname)) {
        const playlist = new URL(source);
        playlist.pathname = playlist.pathname.replace(/\/play_\d+p\.mp4$/i, '/playlist.m3u8');
        playlist.search = '';
        add(playlist.toString());
        for (const quality of ['720', '480', '360', '240']) {
          const mp4 = new URL(source);
          mp4.pathname = mp4.pathname.replace(/\/play_\d+p\.mp4$/i, `/play_${quality}p.mp4`);
          mp4.search = '';
          add(mp4.toString());
        }
      }
    }
  } catch {
    return Array.from(urls);
  }

  return Array.from(urls);
}

export function getBunnyStreamHlsUrl(url: string | null | undefined): string {
  const source = getBunnySourceUrl(url);
  if (!source) return "";

  try {
    const parsed = new URL(source);
    if (parsed.hostname.endsWith('.b-cdn.net') && /\/play_\d+p\.mp4$/i.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/\/play_\d+p\.mp4$/i, '/playlist.m3u8');
      parsed.search = '';
      return parsed.toString();
    }
  } catch {
    return source;
  }

  return source;
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