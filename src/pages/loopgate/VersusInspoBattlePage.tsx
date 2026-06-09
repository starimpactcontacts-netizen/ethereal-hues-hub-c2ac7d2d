import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Swords, Trophy, Loader2, Send, Link as LinkIcon, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVersusInspoBattle, submitVersusInspoEdit } from '@/hooks/useVersusInspo';
import { getEmbedUrl, detectPlatform } from '@/lib/videoEmbed';
import VersusInspoVotePanel from '@/components/loopgate/VersusInspoVotePanel';
import SEO from '@/components/SEO';
import { toast } from 'sonner';

const TEKO = { fontFamily: 'Teko, sans-serif' };

function useCountdown(endsAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return null;
  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function VersusInspoBattlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { battle, loading, myVote, vote, refetch } = useVersusInspoBattle(id);
  const countdown = useCountdown(battle?.voting_ends_at || null);
  const [subUrl, setSubUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const isOwner = user && battle && user.id === battle.creator_id;

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>;
  }
  if (!battle) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center text-white/50 text-sm">Battle not found</div>;
  }

  async function handleSubmit() {
    if (!battle || !subUrl.trim()) return;
    setBusy(true);
    const { error } = await submitVersusInspoEdit(battle.id, subUrl.trim(), detectPlatform(subUrl.trim()));
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Live — 24h vote started');
    refetch();
  }

  const subEmbed = battle.creator_submission_url ? getEmbedUrl(battle.creator_submission_url, battle.creator_submission_platform || undefined) : null;

  const total = battle.creator_votes + battle.inspo_votes;
  const creatorPct = total === 0 ? 50 : Math.round((battle.creator_votes / total) * 100);

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <SEO title={`${battle.title} — Versus Inspo`} description={`${battle.creator_username} vs the inspo. Vote who did it better.`} />

      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-md flex items-center justify-center bg-white/[0.05] border border-white/[0.08]">
            <ArrowLeft className="w-3.5 h-3.5 text-white/70" />
          </button>
          <div className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60" style={TEKO}>Versus Inspo</span>
          </div>
          {battle.status === 'voting' && countdown ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/15 border border-red-500/30 text-red-300">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-black tabular-nums" style={TEKO}>{countdown}</span>
            </div>
          ) : battle.status === 'decided' ? (
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/25" style={TEKO}>Decided</span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40 px-2 py-1" style={TEKO}>Setup</span>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto">
        {/* Title bar — Red vs Blue scoreboard */}
        <div className="grid grid-cols-2 text-center">
          <div className="bg-gradient-to-r from-red-600 to-red-700 py-2.5 px-3 flex items-center justify-between">
            <span className="text-[9px] font-black tracking-[0.25em]" style={TEKO}>RED</span>
            <span className="text-[14px] font-black uppercase truncate ml-2" style={TEKO}>@{battle.creator_username}</span>
          </div>
          <div className="bg-gradient-to-l from-blue-600 to-blue-700 py-2.5 px-3 flex items-center justify-between">
            <span className="text-[14px] font-black uppercase truncate mr-2" style={TEKO}>INSPO</span>
            <span className="text-[9px] font-black tracking-[0.25em]" style={TEKO}>BLUE</span>
          </div>
        </div>

        {/* Side-by-side video stage */}
        <div className="grid grid-cols-2 relative bg-black">
          {/* Creator side */}
          <div className="aspect-[9/16] bg-black relative overflow-hidden border-r border-white/10">
            {subEmbed ? (
              <iframe src={subEmbed} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            ) : battle.creator_submission_url ? (
              <video src={battle.creator_submission_url} className="w-full h-full object-contain" controls playsInline />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-center px-4">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-red-400/40 flex items-center justify-center">
                  <Swords className="w-4 h-4 text-red-400/60" />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-white/50 font-black" style={TEKO}>Waiting On<br />Your Drop</p>
              </div>
            )}
          </div>
          {/* Inspo side */}
          <div className="aspect-[9/16] bg-black relative overflow-hidden">
            <video src={battle.inspo_video_url} poster={battle.inspo_thumbnail_url || undefined} className="w-full h-full object-contain" controls playsInline />
          </div>
        </div>

        {/* Meta */}
        <div className="px-4 pt-4 space-y-1">
          <h1 className="text-2xl font-black uppercase tracking-tight leading-tight" style={TEKO}>{battle.title}</h1>
          <p className="text-[11px] text-white/40">
            🎵 <span className="text-white/70 font-bold">{battle.song_name}</span>{battle.song_artist ? ` · ${battle.song_artist}` : ''}
          </p>
          {battle.caption && <p className="text-[12px] text-white/60 pt-1">{battle.caption}</p>}
          {battle.inspo_source_label && <p className="text-[10px] text-white/30 pt-1">Inspo by {battle.inspo_source_label}</p>}
        </div>

        {/* Owner: submit own version if not yet */}
        {isOwner && battle.status === 'editing' && (
          <div className="px-4 mt-5 space-y-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 text-[11px] text-amber-200/80">
              Make your edit using <b>{battle.song_name}</b>, then drop the URL below to start the 24h vote.
            </div>
            <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black flex items-center gap-1.5" style={TEKO}>
              <LinkIcon className="w-3 h-3" /> Your Edit URL
            </label>
            <input value={subUrl} onChange={(e) => setSubUrl(e.target.value)} placeholder="TikTok / IG / YT link" className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white placeholder:text-white/25" />
            <button onClick={handleSubmit} disabled={busy || !subUrl.trim()} className="w-full py-3 rounded-xl font-black uppercase tracking-wider text-[14px] flex items-center justify-center gap-2 disabled:opacity-30" style={{ ...TEKO, background: '#ef4444', color: '#fff' }}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Start 24H Vote
            </button>
          </div>
        )}

        {/* Vote panel */}
        {(battle.status === 'voting' || battle.status === 'decided') && (
          <VersusInspoVotePanel
            battle={battle}
            myVote={myVote}
            onVote={vote}
            isOwner={!!isOwner}
          />
        )}

        {/* Decided winner badge */}
        {battle.status === 'decided' && battle.winner && (
          <div className="mx-4 mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-center">
            <Trophy className="w-7 h-7 text-amber-400 mx-auto" />
            <p className="text-[10px] text-amber-400 uppercase tracking-[0.25em] font-black mt-2" style={TEKO}>Winner</p>
            <p className="text-2xl font-black uppercase mt-1" style={TEKO}>
              {battle.winner === 'creator' ? `@${battle.creator_username}` : battle.winner === 'inspo' ? 'Inspo' : 'Tie'}
            </p>
            <p className="text-[11px] text-white/50 mt-2">
              {battle.creator_votes}-{battle.inspo_votes} · {total} votes
            </p>
            {battle.winner === 'creator' && (
              <p className="text-[11px] text-emerald-400 mt-2 font-bold">+{battle.rings_awarded} Rings · +{battle.index_awarded} Index · +{battle.xp_awarded} XP</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}