import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Copy, Check, Zap, Eye, Bell } from 'lucide-react';
import { useMySoloShares } from '@/hooks/useSoloShares';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';
import { useState } from 'react';

const teko = { fontFamily: 'Teko, sans-serif' };

const dotGrid = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
  backgroundSize: '16px 16px',
};

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const t = pos[0] === 't', l = pos[1] === 'l';
  return (
    <div className="absolute pointer-events-none z-10" style={{
      [t ? 'top' : 'bottom']: 0, [l ? 'left' : 'right']: 0, width: 12, height: 12,
    }}>
      <div style={{ position: 'absolute', [t ? 'top' : 'bottom']: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.4)' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, [l ? 'left' : 'right']: 0, width: 1, background: 'rgba(255,255,255,0.4)' }} />
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-24">
      <SEO title="My Solo Pages" noindex />

      {/* Top utility bar */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center bg-white/[0.04] active:opacity-60" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center bg-white/[0.04]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <Bell className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4">
        {/* Page title */}
        <div className="pt-4 pb-4 flex items-end justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-7 bg-gold" />
            <h1 className="text-[40px] leading-none font-extrabold tracking-tight uppercase" style={teko}>
              Solo
            </h1>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-white/35 uppercase tracking-[0.22em] font-black" style={teko}>Drops</div>
            <div className="text-lg font-bold leading-none mt-1 tabular-nums">{shares.length}</div>
          </div>
        </div>

        {/* Hero card */}
        <button
          onClick={() => navigate('/solo/create')}
          className="relative mt-5 w-full text-left overflow-hidden active:opacity-80 transition-opacity"
          style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
          {/* Gold top accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] z-10 pointer-events-none" style={{
            background: 'linear-gradient(90deg, #f59e0b, rgba(245,158,11,0.25) 60%, transparent)',
          }} />

          <div className="relative h-44 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 80% at 50% 0%, rgba(239,68,68,0.22) 0%, rgba(0,0,0,0) 55%), linear-gradient(180deg, #1a0606 0%, #0e0e0e 100%)',
              }}
            />
            <div className="absolute inset-0 opacity-[0.06]" style={dotGrid} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 flex items-center justify-center bg-white/[0.04]" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <Zap className="w-7 h-7 text-white" fill="white" />
              </div>
            </div>
          </div>
          <div className="relative px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[22px] font-bold leading-tight uppercase tracking-wide" style={teko}>Drop A New Solo</div>
            <div className="text-[11px] text-white/40 mt-0.5">Post your edit. Earn Rings. Climb Solo charts.</div>
            <div className="mt-3 flex items-center gap-1.5 text-[12px] font-black text-red-500 uppercase tracking-[0.2em]" style={teko}>
              Start Edit
              <span aria-hidden>→</span>
            </div>
          </div>
        </button>

        {/* Stats strip */}
        <div className="mt-3 grid grid-cols-3 gap-[1px]" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="relative px-3 py-3 overflow-hidden" style={{ background: '#0e0e0e' }}>
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={dotGrid} />
            <div className="relative text-[9px] text-white/35 uppercase tracking-[0.2em] font-black" style={teko}>Rings</div>
            <div className="relative text-lg font-bold mt-1 flex items-center gap-1.5 tabular-nums" style={teko}>
              <span className="text-[#3BCB6B]">$R</span><span>{totalRings}</span>
            </div>
          </div>
          <div className="relative px-3 py-3 overflow-hidden" style={{ background: '#0e0e0e' }}>
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={dotGrid} />
            <div className="relative text-[9px] text-white/35 uppercase tracking-[0.2em] font-black" style={teko}>Views</div>
            <div className="relative text-lg font-bold mt-1 flex items-center gap-1.5 tabular-nums" style={teko}>
              <Eye className="w-3.5 h-3.5 text-white/50" />{totalViews}
            </div>
          </div>
          <div className="relative px-3 py-3 overflow-hidden" style={{ background: '#0e0e0e' }}>
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={dotGrid} />
            <div className="relative text-[9px] text-white/35 uppercase tracking-[0.2em] font-black" style={teko}>Avg</div>
            <div className="relative text-lg font-bold mt-1 flex items-center gap-1.5 text-amber-400 tabular-nums" style={teko}>
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {shares.length ? (shares.reduce((s, x) => s + (x.avg_rating || 0), 0) / shares.length).toFixed(1) : '—'}
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="mt-7 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 bg-gold" />
            <h2 className="text-[24px] leading-none font-bold tracking-tight uppercase" style={teko}>My Drops</h2>
          </div>
          {shares.length > 0 && (
            <button
              onClick={() => navigate('/solo/create')}
              className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase tracking-[0.18em]"
              style={teko}
            >
              <Plus className="w-3 h-3" /> New
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-24 bg-white/5 rounded-none" />
            <Skeleton className="h-24 bg-white/5 rounded-none" />
          </div>
        ) : shares.length === 0 ? (
          <div className="relative px-5 py-10 text-center overflow-hidden" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={dotGrid} />
            <div className="relative w-12 h-12 mx-auto flex items-center justify-center bg-white/[0.04]" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <Star className="w-5 h-5 text-white/30" />
            </div>
            <p className="relative text-sm text-white/70 mt-3 font-bold">No drops yet</p>
            <p className="relative text-xs text-white/40 mt-1">Drop your first edit and start earning Rings.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shares.map((s) => (
              <div key={s.id} className="relative overflow-hidden" style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Link to={`/s/${s.slug}`} className="flex gap-3 p-2.5">
                  {/* Thumb */}
                  <div className="relative w-20 h-20 overflow-hidden shrink-0" style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {s.thumbnail_url ? (
                      <img src={s.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white/20" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[8px] font-mono tracking-wider text-white/80" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {s.slug.toUpperCase()}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[9px] text-white/35 uppercase tracking-[0.2em] font-black" style={teko}>Solo Drop</div>
                        <div className="font-bold text-[14px] truncate mt-1">{s.title || 'Untitled Edit'}</div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="text-[12px] font-bold tabular-nums">{s.total_ratings > 0 ? s.avg_rating.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/45">
                      <span className="font-bold text-white/70 tabular-nums">
                        <span className="text-[#3BCB6B]">$R</span> {s.rings_earned}<span className="text-white/30">/100</span>
                      </span>
                      <span className="tabular-nums">{s.views} views</span>
                      <span className="tabular-nums">{s.total_ratings} ratings</span>
                    </div>
                  </div>
                </Link>
                <div className="flex" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => copyLink(s.slug, s.id)}
                    className="flex-1 h-9 text-[11px] font-black tracking-[0.18em] text-white/60 flex items-center justify-center gap-1.5 active:opacity-60 uppercase"
                    style={teko}
                  >
                    {copiedId === s.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === s.id ? 'Copied' : 'Share'}
                  </button>
                  <div className="w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <Link
                    to={`/s/${s.slug}`}
                    className="flex-1 h-9 text-[11px] font-black tracking-[0.18em] text-red-500 flex items-center justify-center gap-1.5 active:opacity-60 uppercase"
                    style={teko}
                  >
                    Open <span aria-hidden>→</span>
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
