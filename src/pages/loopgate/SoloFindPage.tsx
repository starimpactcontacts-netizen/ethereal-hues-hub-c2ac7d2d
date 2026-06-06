import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
import { toast } from 'sonner';
import GateIcon from '@/components/loopgate/GateIcon';

interface ResultRow {
  id: string;
  slug: string;
  username: string;
  avatar_url: string | null;
  title: string | null;
  total_ratings: number;
  avg_rating: number;
  thumbnail_url: string | null;
  created_at: string;
}

export default function SoloFindPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultRow[]>([]);
  const [recent, setRecent] = useState<ResultRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [jumping, setJumping] = useState(false);

  // Load most recent active shares as discovery
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('solo_shares' as any)
        .select('id,slug,username,avatar_url,title,total_ratings,avg_rating,thumbnail_url,created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(15);
      setRecent((data as any) || []);
    })();
  }, []);

  const handleJumpToCode = async () => {
    const c = code.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!c) { toast.error('Enter a room code.'); return; }
    setJumping(true);
    const { data } = await supabase
      .from('solo_shares' as any)
      .select('slug')
      .eq('slug', c)
      .maybeSingle();
    setJumping(false);
    if (!data) { toast.error('No Solo page with that code.'); return; }
    navigate(`/s/${(data as any).slug}`);
  };

  const handleSearch = async (value: string) => {
    setQuery(value);
    const q = value.trim().replace(/^@/, '');
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('solo_shares' as any)
      .select('id,slug,username,avatar_url,title,total_ratings,avg_rating,thumbnail_url,created_at')
      .eq('is_active', true)
      .or(`username.ilike.%${q}%,title.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(30);
    setResults((data as any) || []);
    setSearching(false);
  };

  const Row = ({ r }: { r: ResultRow }) => (
    <Link
      to={`/s/${r.slug}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-white/5 hover:border-white/15 transition-colors"
    >
      {r.avatar_url ? (
        <img src={r.avatar_url} alt={r.username} className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold shrink-0">
          {r.username.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">{r.title || 'Untitled Edit'}</div>
        <div className="text-[11px] text-white/40 truncate">@{r.username} · CODE {r.slug.toUpperCase()}</div>
      </div>
      <div className="flex items-center gap-1 text-amber-400 shrink-0">
        <Star className="w-3.5 h-3.5 fill-amber-400" />
        <span className="text-sm font-bold">{r.total_ratings > 0 ? r.avg_rating.toFixed(1) : '—'}</span>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <SEO title="Find a Solo" noindex />
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-display text-lg tracking-tight">FIND A SOLO</span>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-6">
        {/* Room code jump */}
        <section>
          <label className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2 block">Room Code</label>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 12))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJumpToCode(); }}
              placeholder="ABC1234"
              className="bg-white/5 border-white/10 font-mono tracking-[0.2em] text-center text-base h-12"
            />
            <Button
              onClick={handleJumpToCode}
              disabled={jumping || !code.trim()}
              className="bg-white text-black hover:bg-white/90 font-bold h-12 px-5"
            >
              {jumping ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
            </Button>
          </div>
          <p className="text-[11px] text-white/40 mt-1.5">Type the code an editor gave you.</p>
        </section>

        {/* Username / title search */}
        <section>
          <label className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2 block">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="@username or title"
              className="bg-white/5 border-white/10 pl-9 h-11"
            />
          </div>

          {query.trim().length >= 2 && (
            <div className="mt-3 space-y-2">
              {searching ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-white/40" /></div>
              ) : results.length === 0 ? (
                <p className="text-center text-xs text-white/40 py-4">No Solos match "{query}".</p>
              ) : (
                results.map((r) => <Row key={r.id} r={r} />)
              )}
            </div>
          )}
        </section>

        {/* Latest */}
        {query.trim().length < 2 && (
          <section>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2">Latest Solos</div>
            {recent.length === 0 ? (
              <div className="text-center py-12">
                <GateIcon size={36} className="mx-auto opacity-40" />
                <p className="text-xs text-white/40 mt-3">No Solos yet. Be first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recent.map((r) => <Row key={r.id} r={r} />)}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}