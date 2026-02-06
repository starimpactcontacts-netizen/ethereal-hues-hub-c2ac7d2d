import { useNavigate } from "react-router-dom";
import { RealEditor } from "@/hooks/useRealData";
import VerifiedBadge from "./VerifiedBadge";
import AuthorityBadge from "./AuthorityBadge";
import FoundingBadge from "./FoundingBadge";
import CrewBadge from "./CrewBadge";
import LevelBadge from "./LevelBadge";
import ConnectButton from "./ConnectButton";
import { getRankFromScore, GQTRank } from "@/data/gqtConfig";

// Get class letter from GQT score or level
function getClassLetter(bestGQT: number | null | undefined, level: number | undefined): GQTRank {
  if (bestGQT && bestGQT > 0) {
    return getRankFromScore(bestGQT).rank;
  }
  // Level 2+ without GQT = D class
  if ((level || 1) >= 2) return 'D';
  return 'F';
}

// Get class colors - red F for tested, grey for untested
function getClassColors(classLetter: GQTRank, hasTakenGQT: boolean): string {
  const colors: Record<string, string> = {
    'S++': 'text-gold border-gold bg-gold/10',
    'S+': 'text-gold border-gold/80 bg-gold/10',
    'S': 'text-amber-400 border-amber-400 bg-amber-400/10',
    'A': 'text-emerald-400 border-emerald-400 bg-emerald-400/10',
    'B': 'text-blue-400 border-blue-400 bg-blue-400/10',
    'C': 'text-slate-300 border-slate-400/50 bg-slate-400/10',
    'D': 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    'F': hasTakenGQT ? 'text-red-500 border-red-500/50 bg-red-500/10' : 'text-muted-foreground border-border bg-muted/10',
  };
  return colors[classLetter] || colors['F'];
}

interface EditorCardProps {
  editor: RealEditor;
}

interface EditorCardProps {
  editor: RealEditor;
}

// Get authority role for display (prioritize dev over judge)
function getAuthorityRole(roles?: string[]): 'dev' | 'judge' | 'enterprise' | null {
  if (!roles) return null;
  if (roles.includes('dev')) return 'dev';
  if (roles.includes('judge')) return 'judge';
  if (roles.includes('enterprise')) return 'enterprise';
  return null;
}

export default function EditorCard({ editor }: EditorCardProps) {
  const navigate = useNavigate();
  const isTop10 = (editor.rank || 999) <= 10;
  const authorityRole = getAuthorityRole(editor.roles);
  const classLetter = getClassLetter(editor.best_gatekeeper_qoi, editor.level);
  const hasTakenGQT = !!(editor.best_gatekeeper_qoi && editor.best_gatekeeper_qoi > 0);
  const classColorStyle = getClassColors(classLetter, hasTakenGQT);

  const handleClick = () => {
    navigate(`/editor/${editor.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-surface-1 border p-4 cursor-pointer transition-colors hover:border-gold/50 active:bg-surface-1/80 ${isTop10 ? "border-l-2 border-l-gold border-t-border border-r-border border-b-border" : "border-border"}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {editor.avatar_url ? (
          <img 
            src={editor.avatar_url} 
            alt={editor.display_name || editor.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-muted-foreground">
              {(editor.display_name || editor.username)?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}

        {/* Rank */}
        <div className="w-10 text-center flex-shrink-0">
          <p className={`font-display text-2xl ${isTop10 ? "text-gold" : "text-muted-foreground"}`}>
            {editor.rank || '-'}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Rank</p>
        </div>

        {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <h3 className="font-semibold text-sm truncate">
                {editor.display_name || editor.username}
              </h3>
              {editor.level && editor.level > 1 && <LevelBadge level={editor.level} size="xs" />}
              {editor.verification_status && <VerifiedBadge size="sm" />}
              {authorityRole && <AuthorityBadge role={authorityRole} size="sm" />}
              {editor.is_founding_member && <FoundingBadge size="sm" animate={false} />}
              <span className={`text-[9px] font-semibold uppercase tracking-wider border px-1.5 py-0.5 ${classColorStyle}`}>
                {classLetter}
              </span>
            </div>
            {editor.display_name && (
              <p className="text-[10px] text-muted-foreground mb-1">@{editor.username}</p>
            )}

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider flex-wrap">
            <span>{editor.win_rate?.toFixed(0) || 0}% Win</span>
            <span>{editor.total_events || 0} Events</span>
          <span>{editor.connection_count || 0} Connections</span>
            {editor.created_at && (
              <span className="text-gold/80">Since {new Date(editor.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
            )}
            {editor.crew && (
              <CrewBadge crew={editor.crew} size="sm" />
            )}
          </div>
        </div>

        {/* Connect & Stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Quick Connect - LinkedIn style */}
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            <ConnectButton targetUserId={editor.id} variant="compact" />
          </div>
          
          {/* Level */}
          <div className="text-center">
            <p className="font-display text-xl text-foreground/80">
              {editor.level || 1}
            </p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">LVL</p>
          </div>
          
          {/* Index Score */}
          <div className="text-right">
            <p className="font-display text-2xl text-gold">
              {(editor.global_index_score || 0).toFixed(1)}
            </p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Index</p>
          </div>
        </div>
      </div>
    </div>
  );
}
