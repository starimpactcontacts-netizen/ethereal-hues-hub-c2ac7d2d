import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Copy, Check, UserRound, Eye, ChevronRight, Play } from 'lucide-react';
import { useMySoloShares } from '@/hooks/useSoloShares';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';
import { useState } from 'react';

const TEKO = { fontFamily: 'Teko, sans-serif' };

// Subtle dot-grid texture — same trick as the live Arena/Edit-Battle cards
const dotGrid = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
  backgroundSize: '20px 20px',
};

export default function SoloHubPage() {
  const navigate = useNavigate();
  const { shares, loading } = useMySoloShares();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = async (slug: string, id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/s/${slug}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {}
  };

  const totalRings = shares.reduce((s, x) => s + (x.rings_earned || 0), 0);
  const totalViews = shares.reduce((s, x) => s + (x.views || 0), 0);
  const avgRating = shares.length
    ? (shares.reduce((s, x) => s + (x.avg_rating || 0), 0) / shares.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen text-white pb-24 relative" style={{ background: '#0a0a0a' }}>
      <SEO title="My Solo Pages" noindex />
      <div className="fixed inset-0 pointer-events-none" style={dotGrid} />

      {/* Top bar — flat icon-button chips, matches the live Arena header language */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/[0.06]" style={{ background: 'rgba(10,10,10,0.85)' }}>
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate('/arena')} className="w-8 h-8 rounded-md flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] active:scale-95 transition-all">
            <ArrowLeft className="w-3.5 h-3.5 text-white/70" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.26em] text-white/30" style={TEKO}>My Solo Pages</span>
          <button
            onClick={() => navigate('/solo/create')}
            aria-label="Go to Solo lobby"
            className="w-8 h-8 rounded-md flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 text-white/50" fill="currentColor" />
          </button>
        </div>
      </div>

      <main className="relative max-w-xl mx-auto px-4">
        {/* Hero title — italic bold uppercase Teko, same treatment as Global Leaderboard */}
        <div className="pt-8 pb-1">
          <h1 className="text-5xl sm:text-6xl font-bold leading-[0.85] italic tracking-tighter uppercase" style={TEKO}>
            Solo
          </h1>
          <p className="text-[11px] text-white/35 mt-2 uppercase tracking-wider" style={TEKO}>
            Drop your edit · World rates it · You earn Rings
          </p>
        </div>

        {/* Stats row — dark surfaces, $R currency convention */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl px-3 py-3 flex flex-col items-center gap-1 border border-white/[0.07]" style={{ background: '#111114' }}>
            <span className="text-lg font-black tabular-nums leading-none" style={TEKO}>
              <span style={{ color: '#3BCB6B' }}>$</span>{totalRings}
            </span>
            <span className="text-[8px] text-white/35 uppercase tracking-[0.22em] font-black leading-none" style={TEKO}>Rings</span>
          </div>
          <div className="rounded-xl px-3 py-3 flex flex-col items-center gap-1 border border-white/[0.07]" style={{ background: '#111114' }}>
            <span className="flex items-center gap-1 text-lg font-black tabular-nums leading-none" style={TEKO}>
              <Eye className="w-3.5 h-3.5 text-white/30" />{totalViews}
            </span>
            <span className="text-[8px] text-white/35 uppercase tracking-[0.22em] font-black leading-none" style={TEKO}>Views</span>
          </div>
          <div className="rounded-xl px-3 py-3 flex flex-col items-center gap-1 border border-white/[0.07]" style={{ background: '#111114' }}>
            <span className="flex items-center gap-1 text-lg font-black tabular-nums leading-none" style={TEKO}>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{avgRating}
            </span>
            <span className="text-[8px] text-white/35 uppercase tracking-[0.22em] font-black leading-none" style={TEKO}>Avg</span>
          </div>
        </div>

        {/* CTA — dark dot-grid card w/ accent top bar + glow icon, no bright bevels */}
        <button
          onClick={() => navigate('/solo/create')}
          className="relative mt-3 w-full text-left rounded-2xl overflow-hidden active:scale-[0.985] transition-transform border border-white/[0.07]"
          style={{ background: 'linear-gradient(180deg, #1a1a1e 0%, #0d0d10 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={dotGrid} />
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #3BCB6B, transparent 60%)' }} />
          <div className="relative px-4 py-4 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,203,107,0.12)', border: '2px solid rgba(59,203,107,0.35)', boxShadow: '0 0 14px rgba(59,203,107,0.18)' }}
            >
              <Plus className="w-5 h-5" style={{ color: '#3BCB6B' }} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-black uppercase tracking-tight leading-none" style={TEKO}>Drop A New Solo</div>
              <p className="text-[10px] text-white/40 mt-1 truncate">Post your edit · Earn Rings · Climb the charts</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/25 shrink-0" />
          </div>
        </button>

        {/* Section header — icon badge + Inter title, same convention as Edit Battles */}
        <div className="mt-7 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #3BCB6B, #fbbf24)' }}>
              <UserRound className="w-2.5 h-2.5 text-black" strokeWidth={2.5} />
            </div>
            <h2 className="text-[15px] font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>My Drops</h2>
          </div>
          {shares.length > 0 && (
            <button
              onClick={() => navigate('/solo/create')}
              className="w-7 h-7 rounded-md flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-muted-foreground hover:text-foreground active:scale-[0.97] transition-all"
              aria-label="New solo drop"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2.5">
            <Skeleton className="h-24 bg-white/[0.04] rounded-2xl" />
            <Skeleton className="h-24 bg-white/[0.04] rounded-2xl" />
          </div>
        ) : shares.length === 0 ? (
          <div className="rounded-2xl px-5 py-10 text-center border border-white/[0.07]" style={{ background: '#111114' }}>
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Star className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-[13px] text-white/70 mt-3 font-black uppercase tracking-wide" style={TEKO}>No drops yet</p>
            <p className="text-[11px] text-white/30 mt-1">Drop your first edit and start earning Rings.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {shares.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl overflow-hidden border border-white/[0.07]"
                style={{ background: 'linear-gradient(180deg, #18181b 0%, #0e0e10 100%)' }}
              >
                <Link to={`/s/${s.slug}`} className="flex gap-3 p-3">
                  {/* Thumb — square-rounded, SOLO + slug badges like the live Arena rail card */}
                  <div className="relative w-[78px] h-[78px] rounded-xl overflow-hidden shrink-0" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {s.thumbnail_url ? (
                      <img src={s.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserRound className="w-5 h-5 text-white/15" />
                      </div>
                    )}
                    <span className="absolute top-1 left-1 text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-black leading-none" style={TEKO}>
                      Solo
                    </span>
                    <span className="absolute bottom-1 right-1 text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/70 text-white/70 border border-white/10 leading-none">
                      {s.slug.toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-black" style={TEKO}>Solo Drop</div>
                      <div className="font-black text-[15px] truncate mt-0.5 text-white/90">{s.title || 'Untitled Edit'}</div>
                    </div>
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] font-black tabular-nums" style={{ ...TEKO, color: '#3BCB6B' }}>
                        $ {s.rings_earned}<span className="text-white/25">/100</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-black tabular-nums text-white/40" style={TEKO}>
                        <Eye className="w-2.5 h-2.5" /> {s.views}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-black tabular-nums text-amber-400/80" style={TEKO}>
                        <Star className="w-2.5 h-2.5 fill-amber-400/80" />
                        {s.total_ratings > 0 ? s.avg_rating.toFixed(1) : '—'}
                        <span className="text-white/25 font-bold normal-case tracking-normal">({s.total_ratings})</span>
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="flex gap-2 px-3 pb-3">
                  <button
                    onClick={() => copyLink(s.slug, s.id)}
                    className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-white/70 active:scale-[0.97] transition-transform bg-white/[0.05] border border-white/[0.08]"
                    style={TEKO}
                  >
                    {copiedId === s.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === s.id ? 'Copied' : 'Share'}
                  </button>
                  <Link
                    to={`/s/${s.slug}`}
                    className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-wide active:scale-[0.97] transition-transform"
                    style={{ ...TEKO, background: 'rgba(59,203,107,0.1)', border: '1px solid rgba(59,203,107,0.25)', color: '#3BCB6B' }}
                  >
                    Open <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
