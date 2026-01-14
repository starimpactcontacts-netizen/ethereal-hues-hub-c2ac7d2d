import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Play, ExternalLink, Star, ChevronRight } from "lucide-react";

interface ScoredSubmission {
  id: string;
  submission_url: string;
  platform: string;
  qoi_score: number | null;
  username: string;
  avatar_url: string | null;
}

// Extract thumbnail from platform URL
function getThumbnailUrl(url: string, platform: string): string | null {
  try {
    if (platform === 'tiktok') {
      // TikTok doesn't expose thumbnails easily, return null
      return null;
    }
    if (platform === 'youtube') {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      if (match) {
        return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
      }
    }
    if (platform === 'instagram') {
      // Instagram doesn't expose thumbnails easily
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

// Platform colors
const platformColors: Record<string, string> = {
  tiktok: "from-pink-500 to-cyan-400",
  instagram: "from-purple-500 to-orange-400",
  youtube: "from-red-600 to-red-400",
};

export default function PosterStrip() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [submissions, setSubmissions] = useState<ScoredSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch scored submissions
  useEffect(() => {
    async function fetchSubmissions() {
      const { data, error } = await supabase
        .from('round_participations')
        .select(`
          id,
          submission_url,
          platform,
          qoi_score,
          user_id
        `)
        .not('qoi_score', 'is', null)
        .not('submission_url', 'is', null)
        .order('qoi_score', { ascending: false })
        .limit(20);

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Fetch profiles for usernames
      const userIds = [...new Set(data.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enriched: ScoredSubmission[] = data.map(s => ({
        id: s.id,
        submission_url: s.submission_url!,
        platform: s.platform || 'tiktok',
        qoi_score: s.qoi_score,
        username: profileMap.get(s.user_id)?.username || 'editor',
        avatar_url: profileMap.get(s.user_id)?.avatar_url || null,
      }));

      setSubmissions(enriched);
      setLoading(false);
    }

    fetchSubmissions();
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || submissions.length === 0) return;

    let animationId: number;
    let scrollPosition = 0;

    const animate = () => {
      scrollPosition += 0.5;
      if (scrollPosition >= container.scrollWidth / 2) {
        scrollPosition = 0;
      }
      container.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [submissions]);

  const openFeed = () => {
    navigate('/feed');
  };

  // Hide section completely if no submissions
  if (!loading && submissions.length === 0) {
    return null;
  }

  // Show loading skeleton
  if (loading) {
    return (
      <section className="py-4 overflow-hidden">
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-24 h-36 flex-shrink-0 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  // Duplicate for infinite scroll effect
  const displaySubmissions = [...submissions, ...submissions];

  return (
    <section className="py-4 overflow-hidden">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <Play className="w-3 h-3 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Top Edits</span>
        </div>
        <button 
          onClick={openFeed}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-hidden"
        style={{ scrollBehavior: "auto" }}
      >
        {displaySubmissions.map((submission, index) => {
          const thumbnail = getThumbnailUrl(submission.submission_url, submission.platform);
          const gradient = platformColors[submission.platform] || "from-gray-600 to-gray-400";
          
          return (
            <div
              key={`${submission.id}-${index}`}
              onClick={openFeed}
              className="w-24 h-36 flex-shrink-0 rounded-lg relative overflow-hidden cursor-pointer group transition-transform hover:scale-105"
            >
              {/* Background */}
              {thumbnail ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbnail})` }}
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
              
              {/* Platform icon */}
              <div className="absolute top-1.5 left-1.5">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <Play className="w-2.5 h-2.5 text-white fill-white" />
                </div>
              </div>
              
              {/* QOI Score badge */}
              {submission.qoi_score && (
                <div className="absolute top-1.5 right-1.5 bg-primary/90 rounded px-1 py-0.5 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
                  <span className="text-[10px] font-bold text-primary-foreground">{submission.qoi_score}</span>
                </div>
              )}
              
              {/* User info */}
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-[10px] font-medium text-white truncate">@{submission.username}</p>
              </div>
              
              {/* Play overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
