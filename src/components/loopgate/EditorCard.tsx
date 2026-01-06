import { useNavigate } from "react-router-dom";
import { RealEditor } from "@/hooks/useRealData";
import VerifiedBadge from "./VerifiedBadge";
import AuthorityBadge from "./AuthorityBadge";
import CrewBadge from "./CrewBadge";
import LevelBadge from "./LevelBadge";

interface EditorCardProps {
  editor: RealEditor;
}

const leagueColors: Record<string, string> = {
  elite: "text-gold border-gold",
  pro: "text-blue-400 border-blue-400",
  open: "text-muted-foreground border-muted-foreground/50",
};

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
              <span className={`text-[9px] font-semibold uppercase tracking-wider border px-1.5 py-0.5 ${leagueColors[editor.league] || leagueColors.open}`}>
                {editor.league}
              </span>
            </div>
            {editor.display_name && (
              <p className="text-[10px] text-muted-foreground mb-1">@{editor.username}</p>
            )}

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider flex-wrap">
            <span>{editor.win_rate?.toFixed(0) || 0}% Win</span>
            <span>{editor.total_events || 0} Events</span>
            {editor.crew && (
              <CrewBadge crew={editor.crew} size="sm" />
            )}
          </div>
        </div>

        {/* Index & Level */}
        <div className="flex items-center gap-3 flex-shrink-0">
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
