import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AuthorityGavel } from './LoopgateIcons';

interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  mission_type: 'daily' | 'weekly';
  action_type: string;
  target_count: number;
  jxp_reward: number;
  icon: string;
}

interface MissionProgress {
  id: string;
  mission_id: string;
  current_count: number;
  completed: boolean;
  jxp_claimed: boolean;
}

const ICON_MAP: Record<string, string> = {
  gavel: '⚖️',
  video: '🎬',
  message: '💬',
  trophy: '🏆',
  flame: '🔥',
  star: '⭐',
  target: '🎯',
};

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

export default function JudgeMissionsPanel() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<MissionTemplate[]>([]);
  const [progress, setProgress] = useState<Map<string, MissionProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchMissions();
  }, [user?.id]);

  async function fetchMissions() {
    setLoading(true);
    try {
      const { data: templates } = await supabase
        .from('judge_mission_templates')
        .select('*')
        .eq('is_active', true)
        .order('mission_type', { ascending: true });

      if (!templates) { setLoading(false); return; }
      setMissions(templates as MissionTemplate[]);

      const today = getTodayDate();
      const weekStart = getWeekStart();
      const periods = [today, weekStart];

      const { data: prog } = await supabase
        .from('judge_mission_progress')
        .select('*')
        .eq('judge_id', user!.id)
        .in('period_start', periods);

      const map = new Map<string, MissionProgress>();
      (prog || []).forEach(p => map.set(p.mission_id, p as MissionProgress));
      setProgress(map);
    } catch (e) {
      console.error('Missions fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function claimReward(mission: MissionTemplate) {
    if (!user?.id) return;
    setClaiming(mission.id);
    try {
      // Mark as claimed
      const periodStart = mission.mission_type === 'daily' ? getTodayDate() : getWeekStart();
      await supabase
        .from('judge_mission_progress')
        .update({ jxp_claimed: true })
        .eq('judge_id', user.id)
        .eq('mission_id', mission.id)
        .eq('period_start', periodStart);

      // Award JXP
      await supabase
        .from('profiles')
        .update({ judge_xp: (await supabase.from('profiles').select('judge_xp').eq('id', user.id).single()).data?.judge_xp + mission.jxp_reward })
        .eq('id', user.id);

      toast.success(`+${mission.jxp_reward} JXP claimed!`);
      fetchMissions();
    } catch (e) {
      console.error('Claim error:', e);
      toast.error('Failed to claim reward');
    } finally {
      setClaiming(null);
    }
  }

  const dailyMissions = missions.filter(m => m.mission_type === 'daily');
  const weeklyMissions = missions.filter(m => m.mission_type === 'weekly');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Daily Missions */}
      <MissionSection
        title="Daily Operations"
        subtitle="Resets at midnight"
        missions={dailyMissions}
        progress={progress}
        claiming={claiming}
        onClaim={claimReward}
      />

      {/* Weekly Missions */}
      <MissionSection
        title="Weekly Objectives"
        subtitle="Resets Monday"
        missions={weeklyMissions}
        progress={progress}
        claiming={claiming}
        onClaim={claimReward}
      />
    </div>
  );
}

function MissionSection({
  title,
  subtitle,
  missions,
  progress,
  claiming,
  onClaim,
}: {
  title: string;
  subtitle: string;
  missions: MissionTemplate[];
  progress: Map<string, MissionProgress>;
  claiming: string | null;
  onClaim: (m: MissionTemplate) => void;
}) {
  if (missions.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-red-700" />
          <span className="font-display text-xs uppercase tracking-[0.15em] text-white">{title}</span>
        </div>
        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">{subtitle}</span>
      </div>

      <div className="space-y-0">
        {missions.map((mission, i) => {
          const prog = progress.get(mission.id);
          const current = prog?.current_count || 0;
          const pct = Math.min((current / mission.target_count) * 100, 100);
          const completed = prog?.completed || false;
          const claimed = prog?.jxp_claimed || false;

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="px-4 py-3 border-b border-zinc-900 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <span className="text-lg w-7 text-center shrink-0">
                  {ICON_MAP[mission.icon] || '🎯'}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] text-white font-medium">{mission.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-950 text-red-400 font-mono uppercase">
                      +{mission.jxp_reward} JXP
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-600">{mission.description}</p>

                  {/* Progress bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-zinc-900 overflow-hidden">
                      <motion.div
                        className={`h-full ${completed ? 'bg-green-500' : 'bg-red-700'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono shrink-0">
                      {current}/{mission.target_count}
                    </span>
                  </div>
                </div>

                {/* Claim button */}
                {completed && !claimed ? (
                  <button
                    onClick={() => onClaim(mission)}
                    disabled={claiming === mission.id}
                    className="shrink-0 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-[10px] font-display uppercase tracking-wider transition-colors"
                  >
                    {claiming === mission.id ? '...' : 'Claim'}
                  </button>
                ) : claimed ? (
                  <span className="shrink-0 text-[9px] text-green-500 font-mono uppercase">✓ Claimed</span>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
