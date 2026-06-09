import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Swords, Plus, Trophy, Clock } from 'lucide-react';
import { useVersusInspoList } from '@/hooks/useVersusInspo';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';

const TEKO = { fontFamily: 'Teko, sans-serif' };

export default function VersusInspoListPage() {
  const navigate = useNavigate();
  const { battles, loading } = useVersusInspoList(60);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <SEO title="Versus Inspo — Battle The Inspo" description="Upload an inspo edit, recreate it with the same song, the world votes who did it better." />

      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate('/arena')} className="w-8 h-8 rounded-md flex items-center justify-center bg-white/[0.05] border border-white/[0.08]">
            <ArrowLeft className="w-3.5 h-3.5 text-white/70" />
          </button>
          <div className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60" style={TEKO}>Versus Inspo</span>
          </div>
          <button onClick={() => navigate('/versus/create')} className="w-8 h-8 rounded-md flex items-center justify-center bg-red-500 text-white">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        <div className="pb-3">
          <h1 className="text-5xl font-bold uppercase italic tracking-tighter leading-[0.85]" style={TEKO}>Versus<br />Inspo</h1>
          <p className="text-[11px] text-white/40 mt-2 uppercase tracking-wider" style={TEKO}>Beat The Inspo · Win Rings · Climb XP</p>
        </div>

        <button
          onClick={() => navigate('/versus/create')}
          className="mt-3 w-full rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-600/20 to-red-900/10 p-4 flex items-center gap-3 active:scale-[0.985] transition-transform"
        >
          <div className="w-11 h-11 rounded-full bg-red-500/25 border-2 border-red-400 flex items-center justify-center">
            <Swords className="w-5 h-5 text-red-300" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-[16px] font-black uppercase tracking-tight leading-none" style={TEKO}>Start A New Versus</div>
            <p className="text-[10px] text-white/50 mt-1">Upload inspo · Same song · 24h public vote</p>
          </div>
        </button>

        <div className="mt-7 mb-3 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-[5px] flex items-center justify-center bg-gradient-to-br from-red-500 to-blue-500">
            <Swords className="w-2.5 h-2.5 text-black" strokeWidth={2.5} />
          </div>
          <h2 className="text-[15px] font-extrabold tracking-tight text-foreground">Live + Recent</h2>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-28 bg-white/[0.04] rounded-2xl" />
            <Skeleton className="h-28 bg-white/[0.04] rounded-2xl" />
          </div>
        ) : battles.length === 0 ? (
          <div className="rounded-2xl px-5 py-10 text-center border border-white/[0.07] bg-[#111114]">
            <Swords className="w-6 h-6 text-white/20 mx-auto" />
            <p className="text-[13px] text-white/70 mt-3 font-black uppercase tracking-wide" style={TEKO}>No battles yet</p>
            <p className="text-[11px] text-white/30 mt-1">Be the first to challenge an inspo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {battles.map((b) => {
              const total = b.creator_votes + b.inspo_votes;
              const pct = total === 0 ? 50 : Math.round((b.creator_votes / total) * 100);
              return (
                <Link key={b.id} to={`/versus/${b.id}`} className="rounded-2xl overflow-hidden border border-white/[0.07] bg-gradient-to-b from-[#18181b] to-[#0e0e10]">
                  <div className="grid grid-cols-2 aspect-[4/3] bg-black relative">
                    <div className="relative bg-red-950/40 flex items-center justify-center overflow-hidden">
                      {b.creator_submission_thumbnail ? (
                        <img src={b.creator_submission_thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <span className="text-[9px] text-white/40 font-black uppercase" style={TEKO}>@{b.creator_username.slice(0, 8)}</span>
                      )}
                      <span className="absolute top-1 left-1 text-[7px] font-black px-1 rounded bg-red-500 text-white" style={TEKO}>RED</span>
                    </div>
                    <div className="relative bg-blue-950/40 overflow-hidden">
                      {b.inspo_thumbnail_url ? (
                        <img src={b.inspo_thumbnail_url} alt="" className="w-full h-full object-cover opacity-80" />
                      ) : (
                        <video src={b.inspo_video_url} muted playsInline className="w-full h-full object-cover opacity-80" />
                      )}
                      <span className="absolute top-1 right-1 text-[7px] font-black px-1 rounded bg-blue-500 text-white" style={TEKO}>INSPO</span>
                    </div>
                    {b.status === 'decided' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-amber-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-black uppercase tracking-tight truncate" style={TEKO}>{b.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-white/40 truncate flex-1">{b.song_name}</span>
                      {b.status === 'voting' ? (
                        <span className="flex items-center gap-0.5 text-[8px] text-red-400 font-black"><Clock className="w-2 h-2" /> LIVE</span>
                      ) : (
                        <span className="text-[8px] font-black tabular-nums" style={{ ...TEKO, color: pct >= 50 ? '#ef4444' : '#3b82f6' }}>{pct}-{100 - pct}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}