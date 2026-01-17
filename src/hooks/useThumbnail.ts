import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple in-memory cache for thumbnails
const thumbnailCache = new Map<string, string | null>();

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

// Batch fetch thumbnails for multiple submissions
export async function fetchThumbnailsBatch(submissions: Array<{ submission_url: string; platform: string }>) {
  const results: Record<string, string | null> = {};
  
  await Promise.all(
    submissions.map(async (sub) => {
      const cacheKey = sub.submission_url;
      
      if (thumbnailCache.has(cacheKey)) {
        results[cacheKey] = thumbnailCache.get(cacheKey) || null;
        return;
      }

      // YouTube direct
      if (sub.platform === 'youtube' || sub.submission_url.includes('youtube.com') || sub.submission_url.includes('youtu.be')) {
        const match = sub.submission_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (match) {
          const ytThumbnail = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
          thumbnailCache.set(cacheKey, ytThumbnail);
          results[cacheKey] = ytThumbnail;
          return;
        }
      }

      try {
        const { data } = await supabase.functions.invoke('get-video-thumbnail', {
          body: { url: sub.submission_url, platform: sub.platform }
        });
        const thumb = data?.thumbnailUrl || null;
        thumbnailCache.set(cacheKey, thumb);
        results[cacheKey] = thumb;
      } catch {
        thumbnailCache.set(cacheKey, null);
        results[cacheKey] = null;
      }
    })
  );

  return results;
}
