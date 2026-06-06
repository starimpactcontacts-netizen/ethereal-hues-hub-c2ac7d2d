import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Copy, Check, ExternalLink } from 'lucide-react';
import { useMySoloShares } from '@/hooks/useSoloShares';
import { Skeleton } from '@/components/ui/skeleton';
import SEO from '@/components/SEO';
import { useState } from 'react';

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

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <SEO title="My Solo Pages" noindex />
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display text-lg tracking-tight">MY SOLO</span>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-5">
        <button
          onClick={() => navigate('/solo/create')}
          className="w-full flex items-center justify-center gap-2 bg-black text-white h-12 rounded-xl text-sm mb-5 border border-white/10 active:scale-[0.99] transition-transform"
        >
          <Plus className="w-4 h-4" /> <span className="font-display tracking-tight">NEW SOLO</span>
        </button>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 bg-white/5" />
            <Skeleton className="h-24 bg-white/5" />
          </div>
        ) : shares.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-8 h-8 mx-auto text-white/20" />
            <p className="text-sm text-white/50 mt-3">No Solo pages yet.</p>
            <p className="text-xs text-white/30 mt-1">Drop your first edit and start earning Rings.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {shares.map((s) => (
              <div key={s.id} className="rounded-xl bg-[#0e0e0e] border border-white/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/s/${s.slug}`} className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{s.title || 'Untitled Edit'}</div>
                    <div className="text-[11px] text-white/40 truncate font-mono tracking-wider">CODE {s.slug.toUpperCase()}</div>
                  </Link>
                  <div className="flex items-center gap-1 text-amber-400 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="text-sm font-bold">{s.total_ratings > 0 ? s.avg_rating.toFixed(1) : '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-white/50">
                  <span>{s.total_ratings} ratings</span>
                  <span>💍 {s.rings_earned}/100</span>
                  <span>{s.views} views</span>
                </div>
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => copyLink(s.slug, s.id)}
                    className="flex-1 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    {copiedId === s.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === s.id ? 'Copied' : 'Share link'}
                  </button>
                  <Link
                    to={`/s/${s.slug}`}
                    className="flex-1 h-8 rounded-lg bg-white text-black text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Open page
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