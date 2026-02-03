import { motion } from "framer-motion";
import { 
  ArrowLeft, Shield, Users, Clock, Trophy, Calendar, 
  FileText, Swords, CheckCircle2, Timer, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tournament, TournamentPhase } from "./TournamentCard";

interface TournamentDetailViewProps {
  tournament: Tournament;
  onBack: () => void;
  onReadyUp?: () => void;
  isUserReady?: boolean;
}

const phaseSteps: { phase: TournamentPhase; label: string }[] = [
  { phase: "ready-up", label: "Ready Up" },
  { phase: "submission", label: "Submission" },
  { phase: "bracket", label: "Bracket" },
  { phase: "completed", label: "Winner" },
];

function getPhaseIndex(phase: TournamentPhase): number {
  return phaseSteps.findIndex(s => s.phase === phase);
}

function formatCountdown(endDate: Date): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const diff = Math.max(0, endDate.getTime() - now.getTime());
  
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export default function TournamentDetailView({ 
  tournament, 
  onBack, 
  onReadyUp,
  isUserReady = false 
}: TournamentDetailViewProps) {
  const currentPhaseIndex = getPhaseIndex(tournament.phase);
  const countdown = formatCountdown(tournament.phaseEndsAt);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center hover:bg-surface-1 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg text-foreground truncate">
                {tournament.name}
              </h1>
              {tournament.isSanctioned && (
                <div className="flex items-center gap-1 bg-gold/90 px-2 py-0.5 shrink-0">
                  <Shield className="w-3 h-3 text-background" />
                  <span className="text-[8px] font-bold uppercase tracking-wider text-background">
                    Sanctioned
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner / Poster */}
      <div className="relative h-40 bg-gradient-to-br from-surface-2 to-surface-1 overflow-hidden">
        {tournament.posterUrl ? (
          <img 
            src={tournament.posterUrl} 
            alt={tournament.name}
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Swords className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Prize overlay */}
        {tournament.prizePool && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-background/90 border border-gold/50 px-4 py-2">
            <Trophy className="w-5 h-5 text-gold" />
            <span className="font-display text-xl text-gold">{tournament.prizePool}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Host Unit */}
        <div className="flex items-center gap-3 p-3 bg-surface-1 border border-border">
          {tournament.hostCrewAvatar ? (
            <img 
              src={tournament.hostCrewAvatar} 
              alt={tournament.hostCrew}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hosted by</p>
            <p className="font-display text-foreground">{tournament.hostCrew}</p>
          </div>
        </div>

        {/* Phase Progress */}
        <div className="bg-surface-1 border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Tournament Phase</p>
          <div className="flex items-center justify-between mb-2">
            {phaseSteps.map((step, i) => (
              <div key={step.phase} className="flex flex-col items-center flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                  ${i < currentPhaseIndex 
                    ? 'bg-gold border-gold' 
                    : i === currentPhaseIndex 
                      ? 'bg-gold/20 border-gold' 
                      : 'bg-surface-2 border-border'
                  }
                `}>
                  {i < currentPhaseIndex ? (
                    <CheckCircle2 className="w-4 h-4 text-background" />
                  ) : (
                    <span className={`text-xs font-bold ${
                      i === currentPhaseIndex ? 'text-gold' : 'text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] mt-1 text-center ${
                  i <= currentPhaseIndex ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          {/* Progress line */}
          <div className="relative h-0.5 bg-border mt-2">
            <div 
              className="absolute top-0 left-0 h-full bg-gold transition-all"
              style={{ width: `${(currentPhaseIndex / (phaseSteps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Ready-Up Countdown (only during ready-up phase) */}
        {tournament.phase === "ready-up" && (
          <div className="bg-surface-1 border-2 border-amber-500/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                Ready-Up Window
              </span>
            </div>
            
            {/* Big countdown */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <span className="font-display text-4xl text-foreground">{countdown.hours}</span>
                <p className="text-[10px] text-muted-foreground uppercase">Hours</p>
              </div>
              <span className="font-display text-3xl text-muted-foreground">:</span>
              <div className="text-center">
                <span className="font-display text-4xl text-foreground">{countdown.minutes}</span>
                <p className="text-[10px] text-muted-foreground uppercase">Mins</p>
              </div>
              <span className="font-display text-3xl text-muted-foreground">:</span>
              <div className="text-center">
                <span className="font-display text-4xl text-foreground">{countdown.seconds}</span>
                <p className="text-[10px] text-muted-foreground uppercase">Secs</p>
              </div>
            </div>
            
            {/* Ready count */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Users className="w-4 h-4" />
              <span>
                <span className="text-foreground font-bold">{tournament.readyCount || 0}</span> players ready
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span>min {tournament.minPlayers}</span>
            </div>
            
            {/* Ready Up Button */}
            <Button 
              onClick={onReadyUp}
              disabled={isUserReady}
              className={`w-full py-6 font-display text-lg uppercase tracking-wider ${
                isUserReady 
                  ? 'bg-emerald-500 text-background' 
                  : 'bg-gradient-to-r from-gold via-amber-400 to-gold text-background hover:shadow-lg hover:shadow-gold/30'
              }`}
            >
              {isUserReady ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  You're Ready!
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Ready Up
                </>
              )}
            </Button>
          </div>
        )}

        {/* Player Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-1 border border-border p-3 text-center">
            <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="font-display text-lg text-foreground">{tournament.playerCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Joined</p>
          </div>
          <div className="bg-surface-1 border border-border p-3 text-center">
            <Target className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="font-display text-lg text-foreground">{tournament.minPlayers}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Minimum</p>
          </div>
          <div className="bg-surface-1 border border-border p-3 text-center">
            <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="font-display text-lg text-foreground">{tournament.maxPlayers}</p>
            <p className="text-[9px] text-muted-foreground uppercase">Maximum</p>
          </div>
        </div>

        {/* Rules / Theme */}
        {tournament.theme && (
          <div className="bg-surface-1 border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Theme & Rules</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tournament.theme}
            </p>
          </div>
        )}

        {/* Submission Deadline */}
        {tournament.phase === "submission" && (
          <div className="bg-surface-1 border border-emerald-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Submission Open
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Submit your edit before the deadline to compete in the bracket.
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-mono">
                {countdown.hours}h {countdown.minutes}m remaining
              </span>
            </div>
          </div>
        )}

        {/* Bracket Placeholder */}
        {(tournament.phase === "bracket" || tournament.phase === "completed") && (
          <div className="bg-surface-1 border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Swords className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Bracket</span>
            </div>
            
            {/* Visual bracket placeholder */}
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-surface-2 border border-border flex items-center justify-center mb-3">
                  <Swords className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground">Bracket visualization coming soon</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {tournament.playerCount} players competing
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
