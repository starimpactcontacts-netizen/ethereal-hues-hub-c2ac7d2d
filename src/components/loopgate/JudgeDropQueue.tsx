import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, ExternalLink, Loader2, CheckCircle2, X,
  Sparkles, Play, Clock, UserRound, Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useThumbnail } from '@/hooks/useThumbnail';
import { sendEmailNotification } from '@/hooks/useSendEmailNotification';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { awardReviewXP } from '@/hooks/useJudgeXP';

interface DropRound {
  id: string;
  drop_id: string;
  round_number: number;
  max_submissions: number;
  status: string;
  drop_title?: string;
  artist_name?: string;
  song_name?: string;
}

interface DropSubmission {
  id: string;
  drop_id: string;
  round_id: string | null;
  user_id: string;
  username: string;
  avatar_url: string | null;
  submission_url: string;
  platform: string | null;
  status: string;
  qoi_score: number | null;
  feedback: string | null;
  judge_id: string | null;
  thumbnail_url: string | null;
  video_title: string | null;
  created_at: string;
}

function SubmissionCard({
  sub,
  onScore,
}: {
  sub: DropSubmission;
  onScore: (s: DropSubmission) => void;
}) {
  const { thumbnail } = useThumbnail(sub.submission_url, sub.platform || 'tiktok');
  const thumb = sub.thumbnail_url || thumbnail;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-gold/50 transition-colors"
    >
      <div className="flex gap-3 p-3">
        <div className="relative w-20 aspect-video bg-zinc-800 overflow-hidden shrink-0">
          {thumb ? (
            <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play size={16} className="text-zinc-500" />
            </div>
          )}
          {sub.status === 'scored' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-lg font-black text-gold">{sub.qoi_score}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-zinc-700 overflow-hidden">
              {sub.avatar_url ? (
                <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-full h-full p-0.5 text-zinc-400" />
              )}
            </div>
            <span className="text-xs font-bold text-white truncate">@{sub.username}</span>
          </div>

          {sub.video_title && (
            <p className="text-[10px] text-zinc-400 truncate mb-1">{sub.video_title}</p>
          )}

          <div className="flex items-center gap-2">
            <span className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${
              sub.status === 'scored'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-gold/20 text-gold'
            }`}>
              {sub.status === 'scored' ? `${sub.qoi_score}/100` : 'PENDING'}
            </span>
            <span className="text-[9px] text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {sub.submission_url && (
            <a
              href={sub.submission_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          )}
          {sub.status !== 'scored' && (
            <button
              onClick={() => onScore(sub)}
              className="p-1.5 bg-red-600 hover:bg-red-500 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DropScoringModal({
  sub,
  round,
  onClose,
  onComplete,
}: {
  sub: DropSubmission;
  round: DropRound;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { user, profile } = useAuth();
  const { thumbnail } = useThumbnail(sub.submission_url, sub.platform || 'tiktok');
  const thumb = sub.thumbnail_url || thumbnail;
  const [score, setScore] = useState(50);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('featured_submissions')
        .update({
          qoi_score: score,
          feedback: comment || null,
          judge_id: user.id,
          judge_username: profile.username,
          judged_at: new Date().toISOString(),
          status: 'scored',
        })
        .eq('id', sub.id);

      if (error) throw error;

      // Award XP
      await awardReviewXP(user.id, profile.username, sub.user_id);

      // Notify editor
      await supabase.from('notifications').insert({
        user_id: sub.user_id,
        type: 'drop_scored',
        title: 'Drop Edit Scored! 🔥',
        message: `@${profile.username} rated your edit ${score}/100 in "${round.drop_title || 'Featured Drop'}"`,
        data: { submission_id: sub.id, score, judge: profile.username },
      });

      // Email notification
      sendEmailNotification(sub.user_id, 'score_rated', {
        score,
        judge_username: profile.username,
        feedback: comment || null,
      });

      toast.success(`Scored @${sub.username} — ${score}/100`);
      onComplete();
    } catch (err) {
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600/20 flex items-center justify-center">
              <Music className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                Featured Drop — R{round.round_number}
              </p>
              <p className="text-sm font-bold text-white">{round.drop_title || 'Drop'}</p>
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
              {sub.avatar_url ? (
                <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-full h-full p-2 text-zinc-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">@{sub.username}</p>
              <p className="text-[10px] text-zinc-400">{sub.platform}</p>
            </div>
          </div>

          {thumb && (
            <div className="relative aspect-video bg-zinc-900 overflow-hidden mb-2">
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <a
            href={sub.submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Watch edit
          </a>
        </div>

        {/* Single QOI slider 0-100 */}
        <div className="p-4 space-y-4">
          <div className="text-center mb-2">
            <p className="text-4xl font-black text-white">
              {score}
              <span className="text-lg text-zinc-500">/100</span>
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">QOI Score</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span className="text-[11px] font-bold text-zinc-300">Quality · Originality · Impact</span>
              </div>
              <span className="text-xs font-mono text-zinc-400">{score}/100</span>
            </div>
            <Slider
              value={[score]}
              onValueChange={([v]) => setScore(v)}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] text-zinc-600">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          <Textarea
            placeholder="Feedback for the editor (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-zinc-900 border-zinc-700 text-sm min-h-[60px]"
          />

          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-12 bg-red-600 hover:bg-red-500 text-white"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Submit Score — {score}/100
          </Button>

          <p className="text-[10px] text-zinc-500 text-center">
            This score determines the editor's ranking in Round {round.round_number}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function JudgeDropQueue() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<DropRound[]>([]);
  const [submissions, setSubmissions] = useState<DropSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState<{ sub: DropSubmission; round: DropRound } | null>(null);

  const fetchData = async () => {
    if (!user?.id) return;

    // Fetch rounds assigned to this judge
    const { data: roundsData } = await supabase
      .from('featured_drop_rounds')
      .select('*, featured_drops(title, song_name, featured_artists(name))')
      .eq('judge_id', user.id)
      .order('created_at', { ascending: false });

    const mapped: DropRound[] = (roundsData || []).map((r: any) => ({
      id: r.id,
      drop_id: r.drop_id,
      round_number: r.round_number,
      max_submissions: r.max_submissions,
      status: r.status,
      drop_title: r.featured_drops?.title,
      artist_name: r.featured_drops?.featured_artists?.name,
      song_name: r.featured_drops?.song_name,
    }));
    setRounds(mapped);

    // Fetch submissions for those rounds
    if (mapped.length > 0) {
      const roundIds = mapped.map((r) => r.id);
      const { data: subsData } = await supabase
        .from('featured_submissions')
        .select('*')
        .in('round_id', roundIds)
        .order('created_at', { ascending: true });
      setSubmissions((subsData as DropSubmission[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('judge-drop-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_drop_rounds' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_submissions' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
      </div>
    );
  }

  const pendingRounds = rounds.filter((r) => r.status === 'full' || r.status === 'judging');
  const completedRounds = rounds.filter((r) => r.status === 'completed');

  return (
    <div className="px-3 pt-3 pb-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-red-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Featured Drops</span>
        </div>
        <span className="text-[10px] text-zinc-500">{pendingRounds.length} to judge</span>
      </div>

      {pendingRounds.length === 0 && completedRounds.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No drop rounds assigned to you</p>
          <p className="text-[10px] text-zinc-600 mt-1">Admins assign judges from the Featured Artist panel</p>
        </div>
      ) : (
        <>
          {pendingRounds.map((round) => {
            const roundSubs = submissions.filter((s) => s.round_id === round.id);
            const scored = roundSubs.filter((s) => s.status === 'scored').length;
            const total = roundSubs.length;

            return (
              <div key={round.id} className="border border-red-500/30 bg-red-950/10">
                <div className="p-3 border-b border-red-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">
                        {round.drop_title || 'Drop'} — R{round.round_number}
                      </p>
                      {round.artist_name && (
                        <p className="text-[10px] text-red-400">{round.artist_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gold">
                        {scored}/{total} scored
                      </span>
                      {scored === total && total > 0 && (
                        <p className="text-[9px] text-emerald-400">✓ ALL SCORED</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2 space-y-2">
                  {roundSubs.map((sub) => (
                    <SubmissionCard
                      key={sub.id}
                      sub={sub}
                      onScore={(s) => setScoring({ sub: s, round })}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {completedRounds.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Completed</p>
              {completedRounds.map((round) => {
                const roundSubs = submissions.filter((s) => s.round_id === round.id);
                return (
                  <div key={round.id} className="border border-zinc-800 bg-zinc-900/50 mb-2">
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-zinc-400">
                          {round.drop_title} — R{round.round_number}
                        </p>
                        <span className="text-[10px] text-emerald-400">
                          {roundSubs.length} scored
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {scoring && (
          <DropScoringModal
            sub={scoring.sub}
            round={scoring.round}
            onClose={() => setScoring(null)}
            onComplete={() => {
              setScoring(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
