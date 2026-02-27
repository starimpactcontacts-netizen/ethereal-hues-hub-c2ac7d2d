import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserRound, Play, Clock, ExternalLink, Loader2, 
  Music, Sparkles, CheckCircle2, X,
  Heart, Lightbulb, Zap, Fingerprint
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useThumbnail } from '@/hooks/useThumbnail';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { awardReviewXP } from '@/hooks/useJudgeXP';

interface SoloEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  song_name: string;
  artist_name: string | null;
  theme: string;
  submission_url: string | null;
  submission_platform: string | null;
  submitted_at: string | null;
  status: string;
  judge_id: string | null;
}

const PILLARS = [
  { id: 'quality', label: 'Quality', max: 30, icon: Sparkles, color: 'text-yellow-400' },
  { id: 'originality', label: 'Originality', max: 35, icon: Lightbulb, color: 'text-purple-400' },
  { id: 'impact', label: 'Impact', max: 35, icon: Zap, color: 'text-emerald-400' },
];

function SoloQueueCard({ entry, onClaim }: { entry: SoloEntry; onClaim: (e: SoloEntry) => void }) {
  const { thumbnail } = useThumbnail(entry.submission_url || '', entry.submission_platform || 'youtube');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-gold/50 transition-colors"
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative w-20 aspect-video bg-zinc-800 overflow-hidden shrink-0">
          {thumbnail ? (
            <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play size={16} className="text-zinc-500" />
            </div>
          )}
          <div className="absolute top-1 left-1">
            <span className="text-[8px] font-bold uppercase px-1 py-0.5 bg-gold text-black">
              SOLO
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-zinc-700 overflow-hidden">
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-full h-full p-0.5 text-zinc-400" />
              )}
            </div>
            <span className="text-xs font-bold text-white truncate">@{entry.username}</span>
          </div>

          <div className="flex items-center gap-1.5 mb-1">
            <Music className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-zinc-400 truncate">{entry.song_name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] px-1.5 py-0.5 bg-gold/20 text-gold font-bold uppercase">{entry.theme}</span>
            {entry.submitted_at && (
              <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(entry.submitted_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {entry.submission_url && (
            <a href={entry.submission_url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 transition-colors">
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          )}
          <button onClick={() => onClaim(entry)}
            className="p-1.5 bg-red-600 hover:bg-red-500 transition-colors">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SoloScoringModal({ entry, onClose, onComplete }: { entry: SoloEntry; onClose: () => void; onComplete: () => void }) {
  const { user, profile } = useAuth();
  const { thumbnail } = useThumbnail(entry.submission_url || '', entry.submission_platform || 'youtube');
  const [scores, setScores] = useState({ quality: 20, originality: 20, impact: 20 });
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [dqReason, setDqReason] = useState('');

  const totalScore = scores.quality + scores.originality + scores.impact;

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setSaving(true);

    try {
      // Update solo_submission with scores — the award_solo_index trigger handles index awarding
      const { error } = await supabase
        .from('solo_submissions')
        .update({
          judge_id: user.id,
          quality_score: scores.quality,
          originality_score: scores.originality,
          impact_score: scores.impact,
          qoi_score: totalScore,
          judge_notes: comment || null,
          judged_at: new Date().toISOString(),
          status: 'scored',
          is_disqualified: isDisqualified,
          disqualify_reason: isDisqualified ? (dqReason || null) : null,
        })
        .eq('id', entry.id)
        .select('id')
        .single();

      if (error) {
        console.error('Score submit error:', error);
        throw error;
      }

      // Award judge XP
      await awardReviewXP(user.id, profile.username, entry.user_id);

      // Notify editor
      await supabase.from('notifications').insert({
        user_id: entry.user_id,
        type: 'solo_scored',
        title: 'Solo Edit Scored! 🎬',
        message: `@${profile.username} scored your "${entry.theme}" edit — ${totalScore}/100`,
        data: { solo_id: entry.id, score: totalScore, judge: profile.username },
      });

      // Activity feed
      await supabase.from('activity_feed').insert({
        user_id: entry.user_id,
        username: entry.username,
        avatar_url: entry.avatar_url,
        activity_type: 'solo_scored',
        title: `@${entry.username}'s solo edit was scored`,
        description: `Judge @${profile.username} gave ${totalScore}/100 for "${entry.theme}"`,
        data: { solo_id: entry.id, score: totalScore, theme: entry.theme },
      });

      toast.success(isDisqualified 
        ? `Scored ${totalScore}/100 — DISQUALIFIED (no Index awarded)` 
        : `Scored! ${entry.username} earned ${totalScore} Index`);
      onComplete();
    } catch (err: any) {
      toast.error('Failed to submit score');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-[10px] text-gold font-bold uppercase tracking-wider">Score Solo Edit</p>
              <p className="text-sm font-bold text-white">{entry.theme}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Editor info */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-full h-full p-2 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">@{entry.username}</p>
              <div className="flex items-center gap-1.5">
                <Music className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-zinc-400">{entry.song_name}</span>
              </div>
            </div>
          </div>

          {/* Video preview */}
          {thumbnail && (
            <div className="relative aspect-video bg-zinc-900 overflow-hidden mb-2">
              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          {entry.submission_url && (
            <a href={entry.submission_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" /> Watch full edit
            </a>
          )}
        </div>

        {/* Scoring */}
        <div className="p-4 space-y-4">
          <div className="text-center mb-2">
            <p className="text-3xl font-black text-white">{totalScore}<span className="text-lg text-zinc-500">/100</span></p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">QOI Score</p>
          </div>

          {PILLARS.map(pillar => (
            <div key={pillar.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <pillar.icon className={`w-3.5 h-3.5 ${pillar.color}`} />
                  <span className="text-[11px] font-bold text-zinc-300">{pillar.label}</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {scores[pillar.id as keyof typeof scores]}/{pillar.max}
                </span>
              </div>
              <Slider
                value={[scores[pillar.id as keyof typeof scores]]}
                onValueChange={([v]) => setScores(prev => ({ ...prev, [pillar.id]: v }))}
                max={pillar.max}
                step={1}
                className="w-full"
              />
            </div>
          ))}

          <Textarea
            placeholder="Judge notes (optional)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="bg-zinc-900 border-zinc-700 text-sm min-h-[60px]"
          />

          {/* DQ / Accept Toggle */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => setIsDisqualified(false)}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                  !isDisqualified
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                ✓ ACCEPTED
              </button>
              <button
                onClick={() => setIsDisqualified(true)}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                  isDisqualified
                    ? 'bg-red-600/20 border-red-500 text-red-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                ✗ DISQUALIFIED
              </button>
            </div>
            {isDisqualified && (
              <Textarea
                placeholder="Reason for disqualification (e.g. wrong song used, reposted edit)..."
                value={dqReason}
                onChange={e => setDqReason(e.target.value)}
                className="bg-red-950/30 border-red-500/30 text-sm min-h-[50px] placeholder:text-red-400/40"
              />
            )}
            {isDisqualified && (
              <p className="text-[10px] text-red-400/70">
                Edit still receives its QOI rating, but earns 0 Index. The editor will see why.
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || (isDisqualified && !dqReason.trim())}
            className={`w-full h-12 ${isDisqualified ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {isDisqualified ? `Submit Score — DQ'd (${totalScore}/100)` : `Submit Score — ${totalScore}/100`}
          </Button>

          <p className="text-[10px] text-zinc-500 text-center">
            {isDisqualified 
              ? 'Editor gets rated but earns 0 Index this time'
              : `Editor will earn up to ${totalScore}+ Index points`}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function JudgeSoloQueue() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SoloEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState<SoloEntry | null>(null);

  const fetchQueue = async () => {
    const { data } = await supabase
      .from('solo_submissions')
      .select('id, user_id, username, avatar_url, song_name, artist_name, theme, submission_url, submission_platform, submitted_at, status, judge_id')
      .eq('status', 'submitted')
      .is('judge_id', null)
      .order('submitted_at', { ascending: true })
      .limit(50);
    setEntries((data || []) as SoloEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
    const channel = supabase
      .channel('solo_judge_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solo_submissions' }, () => fetchQueue())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleClaim = async (entry: SoloEntry) => {
    if (!user) return;
    // Claim it — use select to check if update matched any rows
    const { data, error } = await supabase
      .from('solo_submissions')
      .update({ judge_id: user.id, judge_claimed_at: new Date().toISOString(), status: 'judging' })
      .eq('id', entry.id)
      .is('judge_id', null)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      toast.error('Already claimed by another judge');
      fetchQueue();
      return;
    }
    setScoring({ ...entry, judge_id: user.id, status: 'judging' });
    fetchQueue();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-24 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-gold" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Solo Queue</span>
        </div>
        <span className="text-[10px] text-zinc-500">{entries.length} awaiting</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <UserRound className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No solo submissions waiting</p>
          <p className="text-[10px] text-zinc-600 mt-1">Editors submit solos from the Arena</p>
        </div>
      ) : (
        <AnimatePresence>
          {entries.map(entry => (
            <SoloQueueCard key={entry.id} entry={entry} onClaim={handleClaim} />
          ))}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {scoring && (
          <SoloScoringModal
            entry={scoring}
            onClose={() => { setScoring(null); fetchQueue(); }}
            onComplete={() => { setScoring(null); fetchQueue(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
