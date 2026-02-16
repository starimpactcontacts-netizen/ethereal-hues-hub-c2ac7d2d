import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Music, ExternalLink, Users, Trophy, Star, Crown, Flame, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFeaturedArtist, useDropSubmissions } from "@/hooks/useFeaturedDrops";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

function DropLeaderboard({ dropId, dropTitle }: { dropId: string; dropTitle: string }) {
  const { submissions, loading } = useDropSubmissions(dropId);

  if (loading) return <Skeleton className="h-20 w-full" />;

  const scored = submissions.filter(s => s.status === 'scored').sort((a, b) => (b.qoi_score || 0) - (a.qoi_score || 0));
  const pending = submissions.filter(s => s.status === 'pending');

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{dropTitle} — Leaderboard</h3>
      {scored.length === 0 && pending.length === 0 && (
        <p className="text-xs text-muted-foreground">No submissions yet</p>
      )}
      {scored.map((sub, idx) => (
        <div key={sub.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
          idx === 0 ? 'bg-gold/10 border-gold/40' : 'bg-surface-1 border-border'
        }`}>
          <span className={`text-sm font-bold tabular-nums w-6 text-center ${
            idx === 0 ? 'text-gold' : idx === 1 ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            #{idx + 1}
          </span>
          <Link to={`/editor/${sub.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-7 h-7 border border-border">
              <AvatarImage src={sub.avatar_url || ''} />
              <AvatarFallback className="text-[9px] bg-muted">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-bold text-foreground truncate">@{sub.username}</span>
          </Link>
          <div className="text-right shrink-0">
            <span className={`text-sm font-bold tabular-nums ${
              (sub.qoi_score || 0) >= 70 ? 'text-gold' : (sub.qoi_score || 0) >= 40 ? 'text-foreground' : 'text-red-400'
            }`}>
              {Math.round(sub.qoi_score || 0)}
            </span>
            <span className="text-[9px] text-muted-foreground ml-1">QOI</span>
          </div>
          {idx === 0 && <Crown className="w-4 h-4 text-gold shrink-0" />}
        </div>
      ))}
      {pending.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          {pending.length} submissions awaiting judgment...
        </p>
      )}
    </div>
  );
}

export default function ArtistProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { artist, drops, loading } = useFeaturedArtist(slug);
  const [expandedDrop, setExpandedDrop] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Artist not found</p>
          <Link to="/arena" className="text-purple-400 text-xs mt-2 block">← Back to Arena</Link>
        </div>
      </div>
    );
  }

  const socials = artist.social_links || {};

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Banner */}
      <div className="relative">
        {artist.banner_url ? (
          <img src={artist.banner_url} alt="" className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-purple-900/60 to-pink-900/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <Link to="/arena" className="absolute top-4 left-4 p-2 bg-background/80 border border-border rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Profile */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex items-end gap-4">
          <Avatar className="w-20 h-20 border-4 border-purple-500/60 shrink-0 shadow-lg">
            <AvatarImage src={artist.avatar_url || ''} />
            <AvatarFallback className="bg-purple-500/20 text-purple-300 text-2xl font-bold">
              {artist.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl text-foreground">{artist.name}</h1>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[8px]">
                <Music className="w-2.5 h-2.5 mr-0.5" /> FEATURED ARTIST
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{artist.genre} • On Loopgate</p>
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{artist.bio}</p>
        )}

        {/* Social Links */}
        {Object.keys(socials).length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {Object.entries(socials).map(([platform, url]) => (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-1 rounded-full hover:bg-purple-500/20 transition-colors">
                <ExternalLink className="w-3 h-3" />
                {platform}
              </a>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <span className="text-lg font-bold text-foreground tabular-nums">{drops.length}</span>
            <p className="text-[9px] text-muted-foreground uppercase">Drops</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <span className="text-lg font-bold text-foreground tabular-nums">
              {drops.reduce((acc, d) => acc + d.submission_count, 0)}
            </span>
            <p className="text-[9px] text-muted-foreground uppercase">Total Edits</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <span className="text-lg font-bold text-gold tabular-nums">
              {Math.round(Math.max(...drops.map(d => d.top_score), 0))}
            </span>
            <p className="text-[9px] text-muted-foreground uppercase">Best QOI</p>
          </div>
        </div>

        {/* Drops */}
        <div className="mt-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-purple-400" />
            Featured Drops
          </h2>

          {drops.length === 0 && (
            <p className="text-xs text-muted-foreground">No drops yet</p>
          )}

          {drops.map(drop => (
            <div key={drop.id} className="bg-surface-1 border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedDrop(expandedDrop === drop.id ? null : drop.id)}
                className="w-full p-4 text-left flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{drop.title}</h3>
                    <Badge className={`text-[8px] ${
                      drop.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                      drop.status === 'judging' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-muted text-muted-foreground border-border'
                    }`}>
                      {drop.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-1">
                    <Music className="w-3 h-3" /> {drop.song_name} • {drop.submission_count} entries
                  </p>
                </div>
                {drop.top_scorer_username && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-gold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> @{drop.top_scorer_username}
                    </span>
                    <span className="text-[9px] text-muted-foreground">{Math.round(drop.top_score)} QOI</span>
                  </div>
                )}
              </button>

              {expandedDrop === drop.id && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <DropLeaderboard dropId={drop.id} dropTitle={drop.title} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
