import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface JudgeRatingVideo {
  id: string;
  judge_id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  video_url: string;
  title: string | null;
  views_at_submission: number;
  current_views: number;
  viral_bonus_awarded: boolean;
  bonus_xp_awarded: number;
  submitted_at: string;
}

export function useJudgeRatingVideos(judgeId?: string) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<JudgeRatingVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const targetId = judgeId || user?.id;

  const fetchVideos = useCallback(async () => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('judge_rating_videos')
        .select('*')
        .eq('judge_id', targetId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setVideos((data || []).map(v => ({
        ...v,
        platform: v.platform as 'tiktok' | 'instagram' | 'youtube',
      })));
    } catch (error) {
      console.error('Error fetching rating videos:', error);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const submitVideo = async (
    platform: 'tiktok' | 'instagram' | 'youtube',
    videoUrl: string,
    title?: string
  ): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Must be logged in');
      return false;
    }

    try {
      const { error } = await supabase
        .from('judge_rating_videos')
        .insert({
          judge_id: user.id,
          platform,
          video_url: videoUrl,
          title: title || null,
          views_at_submission: 0,
        });

      if (error) throw error;

      toast.success('Rating video submitted!');
      await fetchVideos();
      return true;
    } catch (error: any) {
      console.error('Error submitting video:', error);
      toast.error(error.message || 'Failed to submit video');
      return false;
    }
  };

  const deleteVideo = async (videoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('judge_rating_videos')
        .delete()
        .eq('id', videoId)
        .eq('judge_id', user?.id);

      if (error) throw error;

      toast.success('Video removed');
      await fetchVideos();
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to remove video');
      return false;
    }
  };

  return {
    videos,
    loading,
    submitVideo,
    deleteVideo,
    refresh: fetchVideos,
  };
}

// Hook for all viral rating videos (for display on Judge Hub)
export function useAllRatingVideos(limit: number = 10) {
  const [videos, setVideos] = useState<(JudgeRatingVideo & { 
    judge_username: string;
    judge_avatar: string | null;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [limit]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      // Get recent videos
      const { data: videosData, error } = await supabase
        .from('judge_rating_videos')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!videosData?.length) {
        setVideos([]);
        setLoading(false);
        return;
      }

      // Get judge profiles
      const judgeIds = [...new Set(videosData.map(v => v.judge_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', judgeIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const videosWithJudge = videosData.map(v => ({
        ...v,
        platform: v.platform as 'tiktok' | 'instagram' | 'youtube',
        judge_username: profileMap.get(v.judge_id)?.username || 'Unknown',
        judge_avatar: profileMap.get(v.judge_id)?.avatar_url || null,
      }));

      setVideos(videosWithJudge);
    } catch (error) {
      console.error('Error fetching all rating videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return { videos, loading, refresh: fetchVideos };
}
