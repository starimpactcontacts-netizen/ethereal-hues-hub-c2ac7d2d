import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import VerifiedBadge from './VerifiedBadge';
import { CrownSigil } from './LoopgateIcons';

interface SpotlightEntry {
  id: string;
  judge_id: string;
  spotlight_type: string;
  stat_value: number;
  headline: string | null;
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  verification_status?: boolean;
}

const TYPE_LABELS: Record<string, { label: string; accent: string }> = {
  most_reviews: { label: 'Most Verdicts', accent: 'text-red-400' },
  most_viral: { label: 'Most Viral', accent: 'text-purple-400' },
  highest_jxp: { label: 'Top JXP', accent: 'text-yellow-400' },
  most_controversial: { label: 'Controversial', accent: 'text-orange-400' },
};

export default function JudgeSpotlight() {
  const [spotlights, setSpotlights] = useState<SpotlightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpotlights();
  }, []);

  async function fetchSpotlights() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabase
        .from('judge_spotlights')
        .select('*')
        .eq('spotlight_date', today)
        .order('stat_value', { ascending: false });

      if (!data || data.length === 0) {
        // Try yesterday if today isn't populated yet
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const { data: yesterdayData } = await supabase
          .from('judge_spotlights')
          .select('*')
          .eq('spotlight_date', yesterday)
          .order('stat_value', { ascending: false });

        if (yesterdayData && yesterdayData.length > 0) {
          await enrichWithProfiles(yesterdayData);
          return;
        }
        setLoading(false);
        return;
      }

      await enrichWithProfiles(data);
    } catch (e) {
      console.error('Spotlight fetch error:', e);
      setLoading(false);
    }
  }

  async function enrichWithProfiles(data: any[]) {
    const judgeIds = [...new Set(data.map(s => s.judge_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, verification_status')
      .in('id', judgeIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setSpotlights(data.map(s => ({
      ...s,
      ...profileMap.get(s.judge_id),
    })));
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="h-16 bg-zinc-950 animate-pulse" />
      </div>
    );
  }

  if (spotlights.length === 0) return null;

  return (
    <div className="border-t border-zinc-800">
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <CrownSigil size={14} className="text-red-500" />
          <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-mono">
            Daily Spotlight
          </span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="grid gap-px bg-zinc-800">
          {spotlights.slice(0, 3).map((spotlight, i) => {
            const typeInfo = TYPE_LABELS[spotlight.spotlight_type] || { label: spotlight.spotlight_type, accent: 'text-zinc-400' };

            return (
              <motion.div
                key={spotlight.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-black"
              >
                <Link
                  to={`/judge/${spotlight.username}`}
                  className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Rank indicator */}
                  <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-display ${
                    i === 0 ? 'text-red-400 bg-red-950 border border-red-800' : 'text-zinc-600 bg-zinc-900 border border-zinc-800'
                  }`}>
                    {i + 1}
                  </div>

                  {/* Avatar */}
                  {spotlight.avatar_url ? (
                    <img
                      src={spotlight.avatar_url}
                      alt={spotlight.username || ''}
                      className="w-8 h-8 rounded-sm object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-sm bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                      {(spotlight.username || '?')[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] text-white font-display truncate">
                        {(spotlight.display_name || spotlight.username || '').toUpperCase()}
                      </span>
                      {spotlight.verification_status && <VerifiedBadge size="sm" />}
                    </div>
                    <span className={`text-[9px] font-mono uppercase tracking-wider ${typeInfo.accent}`}>
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Stat */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-display text-white">{spotlight.stat_value}</div>
                    <div className="text-[7px] text-zinc-600 font-mono uppercase">Today</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
