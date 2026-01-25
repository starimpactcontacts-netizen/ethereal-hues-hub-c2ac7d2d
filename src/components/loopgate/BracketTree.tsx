import { motion } from "framer-motion";
import { Trophy, Crown, Swords, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Participant {
  id: string;
  username: string;
  avatar_url: string | null;
  qoi_score: number | null;
  eliminated_at: string | null;
  final_rank: number | null;
}

interface Match {
  id: string;
  round: number;
  position: number;
  player1: Participant | null;
  player2: Participant | null;
  winner: Participant | null;
  score1?: number | null;
  score2?: number | null;
}

interface BracketTreeProps {
  participants: Participant[];
  bracketData?: Record<string, unknown>;
}

// Generate bracket structure from participants
function generateBracket(participants: Participant[]): { rounds: Match[][]; champion: Participant | null } {
  // Include all participants who have submitted OR have been scored
  // Sort by QOI score (scored first, then by join order for unscored)
  const sorted = [...participants]
    .filter(p => p.username) // Include anyone in the tournament
    .sort((a, b) => {
      // Scored participants first, sorted by score
      if (a.qoi_score !== null && b.qoi_score !== null) {
        return (b.qoi_score || 0) - (a.qoi_score || 0);
      }
      // Scored before unscored
      if (a.qoi_score !== null) return -1;
      if (b.qoi_score !== null) return 1;
      // Unscored: maintain original order (join order)
      return 0;
    });

  const count = sorted.length;
  if (count < 2) return { rounds: [], champion: sorted[0] || null };

  // Calculate bracket size (next power of 2)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(count)));
  const numRounds = Math.ceil(Math.log2(bracketSize));

  // Generate initial round with byes
  const rounds: Match[][] = [];
  const round1: Match[] = [];
  
  for (let i = 0; i < bracketSize / 2; i++) {
    const p1Index = i;
    const p2Index = bracketSize - 1 - i;
    
    const player1 = sorted[p1Index] || null;
    const player2 = sorted[p2Index] || null;
    
    // Determine winner based on elimination status or scores
    let winner: Participant | null = null;
    if (player1 && !player2) winner = player1;
    if (player2 && !player1) winner = player2;
    if (player1 && player2) {
      if (player1.eliminated_at && !player2.eliminated_at) winner = player2;
      else if (player2.eliminated_at && !player1.eliminated_at) winner = player1;
      else if ((player1.qoi_score || 0) > (player2.qoi_score || 0)) winner = player1;
      else if ((player2.qoi_score || 0) > (player1.qoi_score || 0)) winner = player2;
    }
    
    round1.push({
      id: `r1-m${i}`,
      round: 1,
      position: i,
      player1,
      player2,
      winner,
      score1: player1?.qoi_score,
      score2: player2?.qoi_score,
    });
  }
  rounds.push(round1);

  // Generate subsequent rounds
  for (let r = 2; r <= numRounds; r++) {
    const prevRound = rounds[r - 2];
    const currentRound: Match[] = [];
    
    for (let i = 0; i < prevRound.length / 2; i++) {
      const match1 = prevRound[i * 2];
      const match2 = prevRound[i * 2 + 1];
      
      const player1 = match1?.winner || null;
      const player2 = match2?.winner || null;
      
      let winner: Participant | null = null;
      if (player1 && player2) {
        if (player1.eliminated_at && !player2.eliminated_at) winner = player2;
        else if (player2.eliminated_at && !player1.eliminated_at) winner = player1;
        else if (player1.final_rank === 1) winner = player1;
        else if (player2.final_rank === 1) winner = player2;
      } else if (player1 && !player2) {
        winner = player1;
      } else if (player2 && !player1) {
        winner = player2;
      }
      
      currentRound.push({
        id: `r${r}-m${i}`,
        round: r,
        position: i,
        player1,
        player2,
        winner,
        score1: player1?.qoi_score,
        score2: player2?.qoi_score,
      });
    }
    rounds.push(currentRound);
  }

  // Champion is the winner of the final match
  const finalRound = rounds[rounds.length - 1];
  const champion = finalRound?.[0]?.winner || null;

  return { rounds, champion };
}

function getRoundName(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round;
  switch (roundsFromEnd) {
    case 0: return "Final";
    case 1: return "Semi-Finals";
    case 2: return "Quarter-Finals";
    default: return `Round ${round}`;
  }
}

function MatchCard({ match, isLast }: { match: Match; isLast: boolean }) {
  const hasWinner = match.winner !== null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-surface-1 border border-border overflow-hidden min-w-[140px]"
    >
      {/* Player 1 */}
      <div className={`flex items-center gap-2 p-2 border-b border-border/50 ${
        match.winner?.id === match.player1?.id ? "bg-gold/10" : ""
      }`}>
        {match.player1 ? (
          <>
            <Avatar className="w-6 h-6 border border-border">
              <AvatarImage src={match.player1.avatar_url || undefined} />
              <AvatarFallback className="text-[8px] bg-surface-2">
                {match.player1.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={`text-[11px] flex-1 truncate ${
              match.winner?.id === match.player1.id ? "text-gold font-semibold" : 
              match.player1.eliminated_at ? "text-muted-foreground line-through" : "text-foreground"
            }`}>
              {match.player1.username}
            </span>
            {match.score1 !== null && match.score1 !== undefined && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {match.score1.toFixed(0)}
              </span>
            )}
            {match.winner?.id === match.player1.id && (
              <Trophy className="w-3 h-3 text-gold" />
            )}
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">BYE</span>
        )}
      </div>
      
      {/* Player 2 */}
      <div className={`flex items-center gap-2 p-2 ${
        match.winner?.id === match.player2?.id ? "bg-gold/10" : ""
      }`}>
        {match.player2 ? (
          <>
            <Avatar className="w-6 h-6 border border-border">
              <AvatarImage src={match.player2.avatar_url || undefined} />
              <AvatarFallback className="text-[8px] bg-surface-2">
                {match.player2.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={`text-[11px] flex-1 truncate ${
              match.winner?.id === match.player2.id ? "text-gold font-semibold" : 
              match.player2.eliminated_at ? "text-muted-foreground line-through" : "text-foreground"
            }`}>
              {match.player2.username}
            </span>
            {match.score2 !== null && match.score2 !== undefined && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {match.score2.toFixed(0)}
              </span>
            )}
            {match.winner?.id === match.player2.id && (
              <Trophy className="w-3 h-3 text-gold" />
            )}
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">BYE</span>
        )}
      </div>
      
      {/* VS indicator */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-5 h-5 bg-surface-2 border border-border rounded-full flex items-center justify-center">
          <span className="text-[8px] font-bold text-muted-foreground">VS</span>
        </div>
      </div>
    </motion.div>
  );
}

function ChampionCard({ champion }: { champion: Participant }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center"
    >
      <div className="relative mb-2">
        <Crown className="w-8 h-8 text-gold absolute -top-6 left-1/2 -translate-x-1/2" />
        <Avatar className="w-16 h-16 border-4 border-gold shadow-lg shadow-gold/30">
          <AvatarImage src={champion.avatar_url || undefined} />
          <AvatarFallback className="text-xl bg-gold/20 text-gold">
            {champion.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <span className="font-display text-lg text-gold">{champion.username}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Champion</span>
    </motion.div>
  );
}

export default function BracketTree({ participants, bracketData }: BracketTreeProps) {
  const { rounds, champion } = generateBracket(participants);
  
  if (rounds.length === 0) {
    return (
      <div className="p-6 bg-surface-1 border border-border text-center">
        <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Not enough submissions for bracket</p>
      </div>
    );
  }

  const totalRounds = rounds.length;

  return (
    <div className="space-y-6">
      {/* Champion Display */}
      {champion && (
        <div className="p-4 bg-gradient-to-b from-gold/10 to-transparent border border-gold/20">
          <ChampionCard champion={champion} />
        </div>
      )}

      {/* Bracket Grid - Horizontal scroll */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 items-center min-w-max">
          {rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="flex flex-col gap-4">
              {/* Round Header */}
              <div className="text-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {getRoundName(roundIndex + 1, totalRounds)}
                </span>
              </div>
              
              {/* Matches in this round */}
              <div className="flex flex-col gap-4 justify-around" style={{
                minHeight: roundIndex === 0 ? 'auto' : `${rounds[0].length * 80}px`
              }}>
                {round.map((match, matchIndex) => (
                  <div 
                    key={match.id}
                    className="relative"
                    style={{
                      marginTop: roundIndex > 0 ? `${Math.pow(2, roundIndex) * 20}px` : 0,
                      marginBottom: roundIndex > 0 ? `${Math.pow(2, roundIndex) * 20}px` : 0,
                    }}
                  >
                    <MatchCard 
                      match={match} 
                      isLast={roundIndex === rounds.length - 1}
                    />
                    
                    {/* Connector lines */}
                    {roundIndex < rounds.length - 1 && (
                      <div className="absolute right-0 top-1/2 w-4 border-t border-border/50" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gold/20 border border-gold/30" />
          <span>Winner</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-surface-1 border border-border" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="line-through">Name</span>
          <span>Eliminated</span>
        </div>
      </div>
    </div>
  );
}
