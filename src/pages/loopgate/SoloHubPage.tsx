import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Copy, Check, Zap, Eye, Bell } from 'lucide-react';
import { useMySoloShares } from '@/hooks/useSoloShares';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';
import { useState } from 'react';

const teko = { fontFamily: 'Teko, sans-serif' };

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
    <div className="min-h-screen bg-black text-white pb-24">
      <SEO title="My Solo Pages" noindex />

      {/* Top utility bar */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center active:opacity-60">
            <ArrowLeft className="w-4 h-4 text-white/70" />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center">
              <Bell className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4">
        {/* Page title — FACEIT scale */}
        <div className="pt-2 pb-5 flex items-end justify-between border-b border-white/5">
          <h1 className="text-[44px] leading-none font-extrabold tracking-tight" style={teko}>
            SOLO
          </h1>
          <div className="text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Drops</div>
            <div className="text-lg font-bold leading-none mt-1">{shares.length}</div>
          </div>
        </div>

        {/* Hero card */}
        <button
          onClick={() => navigate('/solo/create')}
          className="mt-5 w-full text-left rounded-2xl overflow-hidden bg-[#0e0e0e] border border-white/5 active:opacity-80 transition-opacity"
        >
          <div className="relative h-44 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 80% at 50% 0%, rgba(239,68,68,0.25) 0%, rgba(0,0,0,0) 55%), linear-gradient(180deg, #1a0606 0%, #0e0e0e 100%)',
              }}
            />
            <div className="absolute inset-0 opacity-[0.07]" style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)',
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                <Zap className="w-7 h-7 text-white" fill="white" />
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="text-[22px] font-bold leading-tight" style={teko}>DROP A NEW SOLO</div>
            <div className="text-[12px] text-white/50 mt-0.5">Post your edit. Earn Rings. Climb Solo charts.</div>
            <div className="mt-3 text-[13px] font-extrabold text-red-500 tracking-[0.15em]" style={teko}>
              START EDIT →
            </div>
          </div>
        </button>

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#0e0e0e] border border-white/5 px-3 py-3">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.18em]">Rings</div>
            <div className="text-lg font-bold mt-1 flex items-center gap-1">
              <span>💍</span><span>{totalRings}</span>
            </div>
          </div>
          <div className="rounded-xl bg-[#0e0e0e] border border-white/5 px-3 py-3">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.18em]">Views</div>
            <div className="text-lg font-bold mt-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-white/60" />{totalViews}
            </div>
          </div>
          <div className="rounded-xl bg-[#0e0e0e] border border-white/5 px-3 py-3">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.18em]">Avg</div>
            <div className="text-lg font-bold mt-1 flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {shares.length ? (shares.reduce((s, x) => s + (x.avg_rating || 0), 0) / shares.length).toFixed(1) : '—'}
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="mt-7 mb-3 flex items-center justify-between">
          <h2 className="text-[26px] leading-none font-bold tracking-tight" style={teko}>MY DROPS</h2>
          {shares.length > 0 && (
            <button onClick={() => navigate('/solo/create')} className="text-[11px] font-extrabold text-red-500 tracking-[0.15em]" style={teko}>
              + NEW
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 bg-white/5" />
            <Skeleton className="h-24 bg-white/5" />
          </div>
        ) : shares.length === 0 ? (
          <div className="rounded-2xl bg-[#0e0e0e] border border-white/5 px-5 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] mx-auto flex items-center justify-center">
              <Star className="w-5 h-5 text-white/30" />
            </div>
            <p className="text-sm text-white/70 mt-3 font-bold">No drops yet</p>
            <p className="text-xs text-white/40 mt-1">Drop your first edit and start earning Rings.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shares.map((s) => (
              <div key={s.id} className="rounded-xl bg-[#0e0e0e] border border-white/5 overflow-hidden">
                <Link to={`/s/${s.slug}`} className="flex gap-3 p-2.5">
                  {/* Thumb */}
                  <div className="w-20 h-20 rounded-lg bg-[#171717] overflow-hidden shrink-0 relative">
                    {s.thumbnail_url ? (
                      <img src={s.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white/20" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono tracking-wider text-white/80">
                      {s.slug.toUpperCase()}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] text-white/40 uppercase tracking-[0.18em]">Solo Drop</div>
                        <div className="font-bold text-[14px] truncate mt-0.5">{s.title || 'Untitled Edit'}</div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span className="text-[12px] font-bold">{s.total_ratings > 0 ? s.avg_rating.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-white/50">
                      <span className="font-bold text-white/70">💍 {s.rings_earned}<span className="text-white/30">/100</span></span>
                      <span>{s.views} views</span>
                      <span>{s.total_ratings} ratings</span>
                    </div>
                  </div>
                </Link>
                <div className="flex border-t border-white/5">
                  <button
                    onClick={() => copyLink(s.slug, s.id)}
                    className="flex-1 h-9 text-[11px] font-extrabold tracking-[0.15em] text-white/70 flex items-center justify-center gap-1.5 active:opacity-60"
                    style={teko}
                  >
                    {copiedId === s.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === s.id ? 'COPIED' : 'SHARE'}
                  </button>
                  <div className="w-px bg-white/5" />
                  <Link
                    to={`/s/${s.slug}`}
                    className="flex-1 h-9 text-[11px] font-extrabold tracking-[0.15em] text-red-500 flex items-center justify-center gap-1.5 active:opacity-60"
                    style={teko}
                  >
                    OPEN →
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