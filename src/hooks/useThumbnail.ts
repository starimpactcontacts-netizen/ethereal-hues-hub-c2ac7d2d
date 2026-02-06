import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple in-memory cache for thumbnails
const thumbnailCache = new Map<string, string | null>();

const YT_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

/** Instantly resolve a YouTube thumbnail URL from a video URL — zero network calls */
export function resolveYouTubeThumbnail(url: string): string | null {
  if (!url) return null;
  const match = url.match(YT_REGEX);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

/** Instantly resolve a thumbnail for any platform if possible client-side */
export function resolveInstantThumbnail(url: string, platform: string): string | null {
  if (!url) return null;
  // Check cache
  if (thumbnailCache.has(url)) return thumbnailCache.get(url) || null;
  // YouTube — instant
  if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
    const thumb = resolveYouTubeThumbnail(url);
    if (thumb) { thumbnailCache.set(url, thumb); return thumb; }
  }
  return null;
}

export function useThumbnail(url: string, platform: string) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = url;
    if (thumbnailCache.has(cacheKey)) {
      setThumbnail(thumbnailCache.get(cacheKey) || null);
      setLoading(false);
      return;
    }

    // For YouTube, we can get thumbnail directly without API call
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        const ytThumbnail = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
        thumbnailCache.set(cacheKey, ytThumbnail);
        setThumbnail(ytThumbnail);
        setLoading(false);
        return;
      }
    }

    // Fetch from edge function for TikTok/Instagram
    const fetchThumbnail = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-video-thumbnail', {
          body: { url, platform }
        });

        if (error) {
          console.error('Thumbnail fetch error:', error);
          thumbnailCache.set(cacheKey, null);
          setThumbnail(null);
        } else {
          thumbnailCache.set(cacheKey, data?.thumbnailUrl || null);
          setThumbnail(data?.thumbnailUrl || null);
        }
      } catch (e) {
        console.error('Thumbnail fetch exception:', e);
        thumbnailCache.set(cacheKey, null);
        setThumbnail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnail();
  }, [url, platform]);

  return { thumbnail, loading };
}

// Batch fetch thumbnails for multiple submissions — parallel with concurrency limit
export async function fetchThumbnailsBatch(submissions: Array<{ submission_url: string; platform: string }>) {
  const results: Record<string, string | null> = {};
  const uncached: typeof submissions = [];

  // Resolve cache hits first
  for (const sub of submissions) {
    const cacheKey = sub.submission_url;
    if (thumbnailCache.has(cacheKey)) {
      results[cacheKey] = thumbnailCache.get(cacheKey) || null;
    } else {
      // YouTube direct — no API call needed
      if (sub.platform === 'youtube' || sub.submission_url.includes('youtube.com') || sub.submission_url.includes('youtu.be')) {
        const match = sub.submission_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (match) {
          const ytThumbnail = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
          thumbnailCache.set(cacheKey, ytThumbnail);
          results[cacheKey] = ytThumbnail;
          continue;
        }
      }
      uncached.push(sub);
    }
  }

  // Fetch uncached in parallel batches of 6
  const CONCURRENCY = 6;
  for (let i = 0; i < uncached.length; i += CONCURRENCY) {
    const batch = uncached.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map(async (sub) => {
        try {
          const { data } = await supabase.functions.invoke('get-video-thumbnail', {
            body: { url: sub.submission_url, platform: sub.platform }
          });
          const thumb = data?.thumbnailUrl || null;
          thumbnailCache.set(sub.submission_url, thumb);
          return { url: sub.submission_url, thumb };
        } catch {
          thumbnailCache.set(sub.submission_url, null);
          return { url: sub.submission_url, thumb: null };
        }
      })
    );
    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        results[r.value.url] = r.value.thumb;
      }
    }
  }

  return results;
}
