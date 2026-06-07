import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Copy, Check, Zap, Eye, Bell } from 'lucide-react';
import { useMySoloShares } from '@/hooks/useSoloShares';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';
import { useState, type ReactNode } from 'react';

const teko = { fontFamily: 'Teko, sans-serif' };

// Comic-style outlined text — thick black stroke + drop shadow (Brawl Stars look)
const outline = {
  WebkitTextStroke: '1.5px #000',
  paintOrder: 'stroke fill' as const,
  textShadow: '0 2px 0 rgba(0,0,0,0.35)',
};

// Repeating ring motif — riffs on Loopgate's "Rings" currency, BS-skull-pattern style
const ringPattern = {
  backgroundImage:
    'radial-gradient(circle, transparent 38%, rgba(255,255,255,0.35) 39%, rgba(255,255,255,0.35) 47%, transparent 48%)',
  backgroundSize: '56px 56px',
};

const dotShine = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.16) 2.5px, transparent 2.5px)',
  backgroundSize: '26px 26px',
};

// Chunky 3D-bevel shadow — same trick as the Hub's big red PLAY button
function bevel(top: string, bottom: string) {
  return { boxShadow: `inset 0 2px 0 ${top}, inset 0 -4px 0 ${bottom}` };
}

function StatChip({ icon, value, label, color }: { icon: ReactNode; value: string | number; label: string; color: string }) {
  return (
    <div className="rounded-2xl px-3 py-2.5 flex flex-col items-center gap-1" style={{ background: 'rgba(255,255,255,0.06)', border: `2px solid ${color}33` }}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-base font-black tabular-nums leading-none" style={teko}>{value}</span>
      </div>
      <span className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-black leading-none" style={teko}>{label}</span>
    </div>
  );
}

function Pill({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black tabular-nums leading-none"
      style={{ color, background: `${color}1f`, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
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
  const avgRating = shares.length
    ? (shares.reduce((s, x) => s + (x.avg_rating || 0), 0) / shares.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen text-white pb-24 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1c1733 0%, #0b0a16 40%)' }}>
      <SEO title="My Solo Pages" noindex />

      {/* Repeating ring motif — full-page backdrop texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05]" style={ringPattern} />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 60% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 60%)' }} />

      {/* Top bar — rounded chip buttons */}
      <div className="sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'rgba(12,10,22,0.82)' }}>
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.12)' }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <button className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.12)' }}>
            <Bell className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <main className="relative max-w-xl mx-auto px-4">
        {/* Title — chunky outlined comic text + drop counter chip */}
        <div className="pt-4 pb-1 flex items-end justify-between">
          <h1 className="text-[46px] leading-none font-black uppercase tracking-tight" style={{ ...teko, ...outline }}>
            Solo
          </h1>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.14)' }}>
            <Zap className="w-3.5 h-3.5 text-amber-300" fill="currentColor" />
            <span className="text-sm font-black tabular-nums leading-none">{shares.length}</span>
            <span className="text-[9px] text-white/45 uppercase font-black tracking-[0.16em] leading-none" style={teko}>Drops</span>
          </div>
        </div>

        {/* Hero — vivid gradient panel + big icon + chunky bevelled CTA */}
        <button
          onClick={() => navigate('/solo/create')}
          className="relative mt-4 w-full text-left rounded-[28px] overflow-hidden active:scale-[0.985] transition-transform"
          style={{
            background: 'linear-gradient(135deg, #ff5d3a 0%, #d6336c 52%, #6f2dbd 100%)',
            border: '3px solid rgba(0,0,0,0.35)',
            boxShadow: '0 8px 0 rgba(0,0,0,0.28), 0 16px 32px rgba(170,40,110,0.35)',
          }}
        >
          <div className="absolute inset-0 opacity-[0.35]" style={dotShine} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 58%)' }} />

          <div className="relative px-5 pt-7 pb-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(0,0,0,0.22)', border: '3px solid rgba(255,255,255,0.55)' }}>
              <Zap className="w-9 h-9 text-yellow-300" fill="currentColor" />
            </div>
            <div className="text-[26px] font-black uppercase leading-none" style={{ ...teko, ...outline }}>Drop A New Solo</div>
            <p className="text-[12px] text-white/85 font-bold mt-1.5 max-w-[230px]">Post your edit. Earn Rings. Climb the Solo charts.</p>

            <div
              className="mt-4 w-full max-w-[230px] rounded-2xl py-3 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(180deg, #ffe066 0%, #ffb627 100%)',
                border: '2.5px solid rgba(0,0,0,0.32)',
                ...bevel('rgba(255,255,255,0.55)', 'rgba(150,90,0,0.55)'),
              }}
            >
              <span className="text-[20px] font-black uppercase leading-none text-[#5c3300]" style={teko}>Start Edit</span>
              <span className="text-[18px] font-black leading-none text-[#5c3300]" aria-hidden>→</span>
            </div>
          </div>
        </button>

        {/* Stats strip — currency-chip style, BS top-bar inspired */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatChip
            icon={<span className="font-black text-[15px] leading-none" style={{ ...teko, color: '#3BCB6B' }}>$R</span>}
            value={totalRings}
            label="Rings"
            color="#3BCB6B"
          />
          <StatChip icon={<Eye className="w-4 h-4 text-sky-300" />} value={totalViews} label="Views" color="#7dd3fc" />
          <StatChip icon={<Star className="w-4 h-4 text-amber-300 fill-amber-300" />} value={avgRating} label="Avg" color="#fbbf24" />
        </div>

        {/* Section header */}
        <div className="mt-7 mb-3 flex items-center justify-between">
          <h2 className="text-[28px] leading-none font-black uppercase tracking-tight" style={{ ...teko, ...outline }}>My Drops</h2>
          {shares.length > 0 && (
            <button
              onClick={() => navigate('/solo/create')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide text-[#08390f] active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(180deg, #6EE787 0%, #2FB854 100%)',
                border: '2px solid rgba(0,0,0,0.28)',
                ...bevel('rgba(255,255,255,0.5)', 'rgba(0,80,30,0.45)'),
              }}
            >
              <Plus className="w-3 h-3" /> New
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 bg-white/5 rounded-3xl" />
            <Skeleton className="h-28 bg-white/5 rounded-3xl" />
          </div>
        ) : shares.length === 0 ? (
          <div className="rounded-3xl px-5 py-10 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}>
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.12)' }}>
              <Star className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-sm text-white/80 mt-3 font-black uppercase tracking-wide" style={teko}>No drops yet</p>
            <p className="text-xs text-white/40 mt-1">Drop your first edit and start earning Rings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((s) => (
              <div
                key={s.id}
                className="rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))', border: '2px solid rgba(255,255,255,0.1)' }}
              >
                <Link to={`/s/${s.slug}`} className="flex gap-3 p-3">
                  {/* Thumb — rounded, slug badge */}
                  <div className="relative w-[84px] h-[84px] rounded-2xl overflow-hidden shrink-0" style={{ background: '#19142b', border: '2px solid rgba(255,255,255,0.1)' }}>
                    {s.thumbnail_url ? (
                      <img src={s.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white/20" />
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 px-1.5 py-0.5 rounded-tl-xl text-[8px] font-black tracking-wider text-white/90" style={{ background: 'rgba(0,0,0,0.65)' }}>
                      {s.slug.toUpperCase()}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[9px] text-white/40 uppercase tracking-[0.18em] font-black" style={teko}>Solo Drop</div>
                        <div className="font-black text-[15px] truncate mt-0.5">{s.title || 'Untitled Edit'}</div>
                      </div>
                      {/* Rating badge — circular, achievement-style */}
                      <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.16)', border: '1.5px solid rgba(251,191,36,0.4)' }}>
                        <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span className="text-[12px] font-black text-amber-300 tabular-nums">{s.total_ratings > 0 ? s.avg_rating.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <Pill color="#3BCB6B">$R {s.rings_earned}/100</Pill>
                      <Pill color="#7dd3fc"><Eye className="w-2.5 h-2.5" /> {s.views}</Pill>
                      <Pill color="#c4b5fd">{s.total_ratings} ratings</Pill>
                    </div>
                  </div>
                </Link>

                <div className="flex gap-2 px-3 pb-3">
                  <button
                    onClick={() => copyLink(s.slug, s.id)}
                    className="flex-1 h-10 rounded-2xl flex items-center justify-center gap-1.5 text-[12px] font-black uppercase tracking-wide text-white active:scale-[0.97] transition-transform"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.14)' }}
                  >
                    {copiedId === s.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === s.id ? 'Copied' : 'Share'}
                  </button>
                  <Link
                    to={`/s/${s.slug}`}
                    className="flex-1 h-10 rounded-2xl flex items-center justify-center gap-1.5 text-[12px] font-black uppercase tracking-wide text-[#5c1500] active:scale-[0.97] transition-transform"
                    style={{
                      background: 'linear-gradient(180deg, #ff8a65 0%, #ff5722 100%)',
                      border: '2px solid rgba(0,0,0,0.28)',
                      ...bevel('rgba(255,255,255,0.45)', 'rgba(120,30,0,0.5)'),
                    }}
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
