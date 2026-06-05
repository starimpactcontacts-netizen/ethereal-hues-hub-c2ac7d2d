import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ExternalLink, Loader2, Gavel, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SmartUsername from '@/components/loopgate/SmartUsername';

type Pillar = 'rhythm' | 'creativity' | 'technical' | 'emotional' | 'style';

const PILLARS: { key: Pillar; label: string; max: number; hint: string }[] = [
  { key: 'rhythm',     label: 'Rhythm',     max: 25, hint: 'Beat sync, cut timing, flow' },
  { key: 'creativity', label: 'Creativity', max: 25, hint: 'Originality, ideas, surprise' },
  { key: 'technical',  label: 'Technical',  max: 20, hint: 'Cleanliness, masking, color' },
  { key: 'emotional',  label: 'Emotional',  max: 15, hint: 'Mood, impact, resonance' },
  { key: 'style',      label: 'Style',      max: 15, hint: 'Identity, signature, taste' },
];

const RANK_INDEX_FLOOR: Record<string, number> = {
  'F': 0, 'D': 10, 'C': 20, 'B': 40, 'A': 75, 'S': 120, 'S+': 200, 'S++': 300,
};

function rankFromScore(s: number): string {
  if (s >= 96) return 'S++';
  if (s >= 90) return 'S+';
  if (s >= 80) return 'S';
  if (s >= 70) return 'A';
  if (s >= 60) return 'B';
  if (s >= 50) return 'C';
  if (s >= 40) return 'D';
  return 'F';
}

function rankColor(r: string): string {
  if (r.startsWith('S')) return 'text-gold';
  if (r === 'A') return 'text-emerald-400';
  if (r === 'B') return 'text-blue-400';
  if (r === 'C') return 'text-slate-300';
  if (r === 'D') return 'text-orange-400';
  return 'text-red-500';
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.includes('/shorts/')) {
        const sid = u.pathname.split('/shorts/')[1]?.split('/')[0];
        if (sid) return `https://www.youtube.com/embed/${sid}`;
      }
    }
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    // TikTok long form
    if (u.hostname.includes('tiktok.com') && u.pathname.includes('/video/')) {
      const id = u.pathname.split('/video/')[1]?.split(/[/?]/)[0];
      if (id) return `https://www.tiktok.com/embed/v2/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function GatekeeperRankPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [entry, setEntry] = useState<any>(null);
  const [profile, setProfile] = useState<{ id: string; username: string; avatar_url: string | null } | null>(null);
  const [scores, setScores] = useState<Record<Pillar, number>>({
    rhythm: 12, creativity: 12, technical: 10, emotional: 8, style: 8,
  });
  const [commentary, setCommentary] = useState('');

  const total = PILLARS.reduce((sum, p) => sum + (scores[p.key] || 0), 0);
  const rank = rankFromScore(total);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('gatekeeper_submissions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setEntry(data);
      if (data?.user_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', data.user_id)
          .maybeSingle();
        setProfile(prof as any);
      }
      setLoading(false);
    })();
  }, [id]);

  const embed = entry?.submission_url ? getEmbedUrl(entry.submission_url) : null;

  async function submit() {
    if (!user?.id || !entry) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('gatekeeper_submissions')
        .update({
          status: 'scored',
          qoi_score: total,
          rhythm_score: scores.rhythm,
          creativity_score: scores.creativity,
          technical_score: scores.technical,
          emotional_score: scores.emotional,
          style_score: scores.style,
          gqt_rank: rank,
          judge_commentary: commentary || null,
          judged_at: new Date().toISOString(),
          judge_id: user.id,
        })
        .eq('id', entry.id);
      if (error) throw error;

      // Bump the editor's index floor if this is a new high
      const { data: prof } = await supabase
        .from('profiles')
        .select('best_gatekeeper_qoi, global_index_score, spendable_index')
        .eq('id', entry.user_id)
        .single();

      const prevBest = prof?.best_gatekeeper_qoi || 0;
      if (total > prevBest) {
        const prevRank = rankFromScore(prevBest);
        const delta = (RANK_INDEX_FLOOR[rank] || 0) - (RANK_INDEX_FLOOR[prevRank] || 0);
        await supabase
          .from('profiles')
          .update({
            best_gatekeeper_qoi: total,
            global_index_score: (prof?.global_index_score || 0) + Math.max(delta, 0),
            spendable_index: (prof?.spendable_index || 0) + Math.max(delta, 0),
          })
          .eq('id', entry.user_id);
      }

      // Notify the editor
      await supabase.from('notifications').insert({
        user_id: entry.user_id,
        type: 'gatekeeper_scored',
        title: 'Your Gatekeeper rank is in',
        message: `Ranked ${rank} • ${total}/100`,
        data: { gatekeeper_id: entry.id, score: total, rank },
      });

      toast.success(`Ranked ${rank} • ${total}/100`);
      navigate('/judge-panel');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to submit rank');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <button onClick={() => navigate(-1)} className="text-zinc-400 text-sm flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-center text-zinc-500 mt-20 text-sm">Gatekeeper entry not found.</p>
      </div>
    );
  }

  const alreadyScored = entry.status === 'scored';

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-zinc-900 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-zinc-900">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-cyan-400 tracking-wider">GATEKEEPER RANK</p>
            <p className="text-xs text-zinc-400 truncate"><SmartUsername userId={profile?.id} username={profile?.username || 'editor'} prefix="@" /></p>
          </div>
        </div>
        {alreadyScored && (
          <span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">SCORED</span>
        )}
      </div>

      {/* Video preview */}
      <div className="px-4 pt-4">
        <div className="aspect-video bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex items-center justify-center">
          {embed ? (
            <iframe
              src={embed}
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <a
              href={entry.submission_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 flex items-center gap-2 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" /> Open submission
            </a>
          )}
        </div>
        <a
          href={entry.submission_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
        >
          <ExternalLink className="w-3 h-3" /> View original
        </a>
      </div>

      {/* Live score */}
      <div className="px-4 mt-5">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Live Score</p>
            <p className="text-3xl font-bold text-white tabular-nums">{total}<span className="text-base text-zinc-600">/100</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Rank</p>
            <p className={`text-4xl font-black ${rankColor(rank)}`}>{rank}</p>
          </div>
        </div>
      </div>

      {/* Pillar sliders */}
      <div className="px-4 mt-5 space-y-4">
        {PILLARS.map(p => (
          <div key={p.key}>
            <div className="flex items-baseline justify-between mb-1.5">
              <div>
                <p className="text-xs font-bold text-white">{p.label}</p>
                <p className="text-[10px] text-zinc-500">{p.hint}</p>
              </div>
              <p className="text-sm font-bold text-white tabular-nums">
                {scores[p.key]}<span className="text-zinc-600 text-xs">/{p.max}</span>
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={p.max}
              value={scores[p.key]}
              onChange={e => setScores(s => ({ ...s, [p.key]: Number(e.target.value) }))}
              className="w-full accent-cyan-500"
            />
          </div>
        ))}
      </div>

      {/* Commentary */}
      <div className="px-4 mt-5">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Commentary (optional)</p>
        <textarea
          value={commentary}
          onChange={e => setCommentary(e.target.value)}
          rows={3}
          placeholder="Quick note for the editor..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-none"
        />
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-black/80 px-4 py-4 border-t border-zinc-900">
        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={submitting}
          onClick={submit}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : alreadyScored ? (
            <><CheckCircle2 className="w-4 h-4" /> Re-rank as {rank}</>
          ) : (
            <><Gavel className="w-4 h-4" /> Lock in rank {rank} • +25 JXP</>
          )}
        </motion.button>
      </div>
    </div>
  );
}