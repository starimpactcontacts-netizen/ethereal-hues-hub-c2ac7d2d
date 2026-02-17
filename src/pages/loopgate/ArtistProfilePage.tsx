import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Music, ExternalLink, Crown, Flame, Headphones, Award, Globe, BadgeCheck, TrendingUp, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFeaturedArtist, useDropSubmissions } from "@/hooks/useFeaturedDrops";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import VerifiedBadge from "@/components/loopgate/VerifiedBadge";

// ─── Utility: parse bio for clickable links ──────────────────────
function RichBio({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  
  const parts = text.split(/(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*|[\w.-]+@[\w.-]+\.\w+)/g);
  
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      {parts.map((part, i) => {
        if (urlRegex.test(part)) {
          urlRegex.lastIndex = 0;
          const href = part.startsWith('http') ? part : `https://${part}`;
          return (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-gold transition-colors">
              {part}
            </a>
          );
        }
        if (emailRegex.test(part)) {
          emailRegex.lastIndex = 0;
          return (
            <a key={i} href={`mailto:${part}`}
              className="text-foreground underline underline-offset-2 hover:text-gold transition-colors">
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
}

// ─── Format stream count ──────────────────────────────────────────
function formatStreams(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── Drop Leaderboard ─────────────────────────────────────────────
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
          }`}>#{idx + 1}</span>
          <Link to={`/editor/${sub.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="w-7 h-7 border border-border">
              <AvatarImage src={sub.avatar_url || ''} />
              <AvatarFallback className="text-[9px] bg-muted">{sub.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-bold text-foreground truncate">@{sub.username}</span>
          </Link>
          <div className="text-right shrink-0">
            <span className={`text-sm font-bold tabular-nums ${
              (sub.qoi_score || 0) >= 70 ? 'text-gold' : (sub.qoi_score || 0) >= 40 ? 'text-foreground' : 'text-destructive'
            }`}>{Math.round(sub.qoi_score || 0)}</span>
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function ArtistProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { artist, drops, loading } = useFeaturedArtist(slug);
  const [expandedDrop, setExpandedDrop] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-56 w-full" />
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
          <Link to="/arena" className="text-foreground text-xs mt-2 block underline">← Back to Arena</Link>
        </div>
      </div>
    );
  }

  const socials = artist.social_links || {};
  const achievements = (artist.achievements || []) as Array<{ label: string; icon?: string }>;
  const hasStreams = artist.monthly_streams > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ═══ HERO BANNER — cinematic gradient ═══ */}
      <div className="relative">
        {artist.banner_url ? (
          <img src={artist.banner_url} alt="" className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-background via-surface-1 to-background" />
        )}
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
        
        <Link to="/arena" className="absolute top-4 left-4 p-2.5 bg-background/60 backdrop-blur-md border border-border/50 rounded-full hover:bg-background/80 transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
      </div>

      {/* ═══ ARTIST IDENTITY CARD ═══ */}
      <div className="px-4 -mt-20 relative z-10">
        {/* Avatar + Name block */}
        <div className="flex items-end gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 border-[3px] border-foreground/20 shrink-0 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <AvatarImage src={artist.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="bg-surface-1 text-foreground text-3xl font-display">
                {artist.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {artist.verified && (
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                <VerifiedBadge size="md" />
              </div>
            )}
          </div>
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl text-foreground uppercase tracking-tight leading-none">{artist.name}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-foreground/10 text-foreground border-foreground/20 text-[8px] font-bold uppercase tracking-widest">
                <Music className="w-2.5 h-2.5 mr-1" /> Featured Artist
              </Badge>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{artist.genre}</span>
            </div>
          </div>
        </div>

        {/* ═══ MONTHLY STREAMS — Billboard style metric ═══ */}
        {hasStreams && (
          <div className="mt-5 bg-surface-1 border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-display text-foreground tabular-nums tracking-tight">{formatStreams(artist.monthly_streams)}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Monthly Streams</p>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground ml-auto" />
          </div>
        )}

        {/* ═══ BIO — with clickable links ═══ */}
        {artist.bio && (
          <div className="mt-4">
            <RichBio text={artist.bio} />
          </div>
        )}

        {/* ═══ LINKS & SOCIALS — clean pill buttons ═══ */}
        {(Object.keys(socials).length > 0 || artist.website_url) && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {artist.website_url && (
              <a href={artist.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold text-foreground bg-foreground/5 border border-foreground/10 px-3 py-1.5 rounded-full hover:bg-foreground/10 transition-colors uppercase tracking-wider">
                <Globe className="w-3 h-3" /> Website
              </a>
            )}
            {Object.entries(socials).map(([platform, url]) => (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-bold text-foreground bg-foreground/5 border border-foreground/10 px-3 py-1.5 rounded-full hover:bg-foreground/10 transition-colors uppercase tracking-wider">
                <ExternalLink className="w-3 h-3" /> {platform}
              </a>
            ))}
          </div>
        )}

        {/* ═══ STATS ROW — clean authority design ═══ */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <span className="text-xl font-display text-foreground tabular-nums">{drops.length}</span>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">Drops</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <span className="text-xl font-display text-foreground tabular-nums">
              {drops.reduce((acc, d) => acc + d.submission_count, 0)}
            </span>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">Total Edits</p>
          </div>
          <div className="bg-surface-1 border border-border rounded-lg p-3 text-center">
            <span className="text-xl font-display text-gold tabular-nums">
              {Math.round(Math.max(...drops.map(d => d.top_score), 0))}
            </span>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">Best QOI</p>
          </div>
        </div>

        {/* ═══ ACHIEVEMENTS — prestige badges ═══ */}
        {achievements.length > 0 && (
          <div className="mt-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-3">
              <Award className="w-3.5 h-3.5" /> Achievements
            </h2>
            <div className="flex gap-2 flex-wrap">
              {achievements.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gold/5 border border-gold/20 rounded-full px-3 py-1.5">
                  <span className="text-sm">{a.icon || '🏆'}</span>
                  <span className="text-[10px] font-bold text-foreground">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FEATURED DROPS ═══ */}
        <div className="mt-6 space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-destructive" /> Featured Drops
          </h2>

          {drops.length === 0 && (
            <p className="text-xs text-muted-foreground">No drops yet</p>
          )}

          {drops.map(drop => (
            <div key={drop.id} className="bg-surface-1 border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedDrop(expandedDrop === drop.id ? null : drop.id)}
                className="w-full p-4 text-left flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground truncate">{drop.title}</h3>
                    <Badge className={`text-[8px] shrink-0 ${
                      drop.status === 'live' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                      drop.status === 'judging' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-muted text-muted-foreground border-border'
                    }`}>
                      {drop.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-1">
                    <Play className="w-3 h-3" /> {drop.song_name} · {drop.submission_count} entries
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

        {/* ═══ SHARE LINK — clean shareable URL ═══ */}
        <div className="mt-6 mb-4 text-center">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Share this profile</p>
          <p className="text-xs text-foreground font-mono mt-1 select-all bg-surface-1 border border-border rounded-lg px-3 py-2 inline-block">
            loopgate.io/artist/{artist.slug}
          </p>
        </div>
      </div>
    </div>
  );
}
