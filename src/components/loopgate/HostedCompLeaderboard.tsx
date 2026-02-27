import { Trophy, Crown, Medal, Award, ExternalLink } from "lucide-react";
import { HostedCompetitionSubmission } from "@/hooks/useHostedCompetitions";

interface HostedCompLeaderboardProps {
  submissions: HostedCompetitionSubmission[];
  isJudging: boolean;
  isCompleted: boolean;
}

export default function HostedCompLeaderboard({ 
  submissions, 
  isJudging, 
  isCompleted 
}: HostedCompLeaderboardProps) {
  // Sort by score (scored first, then by score desc)
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.score !== null && b.score === null) return -1;
    if (a.score === null && b.score !== null) return 1;
    if (a.score !== null && b.score !== null) return b.score - a.score;
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  const winners = sortedSubmissions.filter(s => s.is_winner).sort((a, b) => (a.winner_place || 99) - (b.winner_place || 99));
  const hasWinners = winners.length > 0;
  const hasScoredSubmissions = sortedSubmissions.some(s => s.score !== null);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-gold" />
          Leaderboard
        </h3>
        {isJudging && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase rounded animate-pulse">
            Scoring in Progress
          </span>
        )}
      </div>

      {/* Winners Podium (if completed) */}
      {isCompleted && hasWinners && (
        <div className="bg-gradient-to-br from-gold/10 via-amber-500/5 to-transparent border border-gold/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-gold" />
            <span className="text-sm font-bold text-gold">Winners</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((place) => {
              const winner = winners.find(w => w.winner_place === place);
              const PlaceIcon = place === 1 ? Crown : place === 2 ? Medal : Award;
              const colors = place === 1 
                ? 'bg-gold/20 border-gold/40 text-gold' 
                : place === 2 
                  ? 'bg-zinc-300/20 border-zinc-300/40 text-zinc-300' 
                  : 'bg-amber-600/20 border-amber-600/40 text-amber-600';

              return (
                <div 
                  key={place} 
                  className={`bg-surface-1 border rounded-lg p-3 text-center ${
                    winner ? colors.split(' ')[1] : 'border-border opacity-50'
                  }`}
                >
                  <PlaceIcon className={`w-5 h-5 mx-auto mb-2 ${
                    winner ? colors.split(' ')[2] : 'text-muted-foreground'
                  }`} />
                  {winner ? (
                    <>
                      <div className="w-10 h-10 rounded-full mx-auto mb-2 overflow-hidden border-2 border-current">
                        {winner.avatar_url ? (
                          <img src={winner.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-2 text-sm">
                            {winner.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold truncate">{winner.username}</p>
                      {winner.score !== null && (
                        <p className="text-[10px] text-muted-foreground">{winner.score} pts</p>
                      )}
                    </>
                  ) : (
                    <div className="py-2">
                      <p className="text-xs text-muted-foreground">#{place}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {sortedSubmissions.length > 0 ? (
        <div className="space-y-2">
          {sortedSubmissions.slice(0, 10).map((sub, idx) => {
            const rank = idx + 1;
            const isWinner = sub.is_winner;
            
            return (
              <div 
                key={sub.id}
                className={`bg-surface-1 border rounded-lg p-3 flex items-center gap-3 ${
                  isWinner ? 'border-gold/30' : 'border-border'
                }`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  rank === 1 ? 'bg-gold/20 text-gold' :
                  rank === 2 ? 'bg-zinc-300/20 text-zinc-300' :
                  rank === 3 ? 'bg-amber-600/20 text-amber-600' :
                  'bg-surface-2 text-muted-foreground'
                }`}>
                  {sub.score !== null ? rank : '-'}
                </div>

                {/* User */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-surface-2 overflow-hidden">
                    {sub.avatar_url ? (
                      <img src={sub.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        {sub.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate">{sub.username}</p>
                      {isWinner && <Crown className="w-3 h-3 text-gold" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase">{sub.platform}</p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  {sub.score !== null ? (
                    <>
                      <p className="text-lg font-bold text-cyan-400">{sub.score}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Score</p>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                </div>

                {/* Link */}
                <a 
                  href={sub.submission_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-surface-2 rounded-lg"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
            );
          })}

          {sortedSubmissions.length > 10 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              +{sortedSubmissions.length - 10} more entries
            </p>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-surface-1 border border-border rounded-lg p-6 text-center">
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className={`w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center ${
                  i === 1 ? 'border-gold/30 h-14' : 
                  i === 2 ? 'border-zinc-400/30' : 
                  'border-amber-600/30'
                }`}
              >
                <span className={`text-sm font-bold ${
                  i === 1 ? 'text-gold/50' : 
                  i === 2 ? 'text-zinc-400/50' : 
                  'text-amber-600/50'
                }`}>#{i}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-1">No entries yet</p>
          <p className="text-xs text-muted-foreground/70">Be the first to submit!</p>
        </div>
      )}
    </div>
  );
}
