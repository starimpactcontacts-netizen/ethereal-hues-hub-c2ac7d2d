import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoStats {
  views: number | null;
  thumbnailUrl: string | null;
  title: string | null;
}

// Cache for video stats
const statsCache = new Map<string, VideoStats>();

export function useVideoStats(url: string, platform: string) {
  const [stats, setStats] = useState<VideoStats>({ views: null, thumbnailUrl: null, title: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const cacheKey = url;
    
    // Check cache first
    if (statsCache.has(cacheKey)) {
      setStats(statsCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    // For YouTube, we can get thumbnail directly
    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        const ytStats: VideoStats = {
          views: null,
          thumbnailUrl: `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`,
          title: null
        };
        statsCache.set(cacheKey, ytStats);
        setStats(ytStats);
        setLoading(false);
        return;
      }
    }

    // Fetch from edge function
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-video-stats', {
          body: { url, platform }
        });

        if (error) {
          console.error('Video stats fetch error:', error);
          statsCache.set(cacheKey, { views: null, thumbnailUrl: null, title: null });
          setStats({ views: null, thumbnailUrl: null, title: null });
        } else {
          const fetchedStats: VideoStats = {
            views: data?.views || null,
            thumbnailUrl: data?.thumbnailUrl || null,
            title: data?.title || null
          };
          statsCache.set(cacheKey, fetchedStats);
          setStats(fetchedStats);
        }
      } catch (e) {
        console.error('Video stats fetch exception:', e);
        statsCache.set(cacheKey, { views: null, thumbnailUrl: null, title: null });
        setStats({ views: null, thumbnailUrl: null, title: null });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [url, platform]);

  return { ...stats, loading };
}
