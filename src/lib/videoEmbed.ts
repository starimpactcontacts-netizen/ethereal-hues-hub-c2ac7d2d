// Lightweight client-side embed URL builder for Solo Share player.
export function getEmbedUrl(url: string, platform?: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const p = (platform || '').toLowerCase();

    if (p === 'youtube' || host.includes('youtube') || host.includes('youtu.be')) {
      if (host.includes('youtu.be')) {
        const id = u.pathname.slice(1);
        if (id) return `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`;
      }
      if (u.pathname.includes('/shorts/')) {
        const id = u.pathname.split('/shorts/')[1]?.split('/')[0];
        if (id) return `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`;
      }
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`;
    }
    if (p === 'tiktok' || host.includes('tiktok')) {
      const parts = u.pathname.split('/');
      const idx = parts.indexOf('video');
      if (idx !== -1 && parts[idx + 1]) {
        return `https://www.tiktok.com/embed/v2/${parts[idx + 1]}`;
      }
    }
    if (p === 'instagram' || host.includes('instagram')) {
      const reel = u.pathname.match(/\/reel\/([^/]+)/);
      const post = u.pathname.match(/\/p\/([^/]+)/);
      const id = reel?.[1] || post?.[1];
      if (id) return `https://www.instagram.com/reel/${id}/embed`;
    }
    return null;
  } catch {
    return null;
  }
}

export function detectPlatform(url: string): 'tiktok' | 'instagram' | 'youtube' | 'other' {
  try {
    const h = new URL(url).hostname.toLowerCase();
    if (h.includes('tiktok')) return 'tiktok';
    if (h.includes('instagram')) return 'instagram';
    if (h.includes('youtube') || h.includes('youtu.be')) return 'youtube';
    return 'other';
  } catch { return 'other'; }
}