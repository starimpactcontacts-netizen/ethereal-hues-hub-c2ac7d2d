import { motion } from "framer-motion";
import { 
  ArrowLeft, Plus, Users, Trophy, Clock, 
  Sparkles, Crown, UserPlus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFriendlyTournamentList, FriendlyTournament } from "@/hooks/useFriendlyTournament";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface FriendlyTournamentListProps {
  onBack: () => void;
  onCreate: () => void;
  onSelectTournament: (tournament: FriendlyTournament) => void;
}

function TournamentRow({ 
  tournament, 
  onJoin 
}: { 
  tournament: FriendlyTournament; 
  onJoin: () => void;
}) {
  const slotsLeft = tournament.max_players - tournament.current_players;
  const isFull = slotsLeft === 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-surface-1 border border-border p-3 flex items-center gap-3"
    >
      {/* Icon */}
      <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
        <Trophy className="w-5 h-5 text-violet-400" />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">
          {tournament.name}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {tournament.current_players}/{tournament.max_players}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {tournament.duration_minutes}m
          </span>
          {tournament.judge_username && (
            <span className="text-[10px] text-amber-400 flex items-center gap-1">
              <Crown className="w-3 h-3" />
              {tournament.judge_username}
            </span>
          )}
        </div>
      </div>
      
      {/* Join button */}
      <Button
        size="sm"
        onClick={onJoin}
        disabled={isFull}
        className={`shrink-0 h-8 px-3 ${
          isFull 
            ? "bg-muted text-muted-foreground" 
            : "bg-violet-500 hover:bg-violet-600 text-white"
        }`}
      >
        {isFull ? (
          <span className="text-xs">Full</span>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            <span className="text-xs">Join</span>
          </>
        )}
      </Button>
    </motion.div>
  );
}

export default function FriendlyTournamentList({ 
  onBack, 
  onCreate, 
  onSelectTournament 
}: FriendlyTournamentListProps) {
  const { tournaments: openTournaments, myTournaments, loading } = useFriendlyTournamentList();
  const { user } = useAuth();
  
  // Filter out user's own tournaments from open list
  const availableTournaments = openTournaments.filter(t => 
    t.creator_id !== user?.id && t.status === 'filling'
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,hsl(var(--violet-500)/0.08),transparent_50%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="relative px-4 pt-5 pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-violet-400 to-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Trophy className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-foreground tracking-wide">FRIENDLY COMP</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Custom brackets · No stakes · Just vibes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {/* My Active Tournaments */}
        {myTournaments.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Your Active Comps
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="space-y-2">
              {myTournaments.map((tournament) => (
                <TournamentRow
                  key={tournament.id}
                  tournament={tournament}
                  onJoin={() => onSelectTournament(tournament)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Open Tournaments - Main Focus */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Open Lobbies
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({availableTournaments.length} waiting)
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-1 border border-border p-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-32" />
                      <div className="h-2 bg-muted rounded w-20" />
                    </div>
                    <div className="w-16 h-8 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : availableTournaments.length === 0 ? (
            <div className="bg-surface-1 border border-dashed border-border p-8 text-center">
              <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-1">No open lobbies right now</p>
              <p className="text-[10px] text-muted-foreground">
                Be the first to create one!
              </p>
            </div>
          ) : (
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {availableTournaments.map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TournamentRow
                    tournament={tournament}
                    onJoin={() => onSelectTournament(tournament)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Create Button - Prominent at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={onCreate}
            className="w-full h-14 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-medium shadow-lg shadow-violet-500/25"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="text-sm">Create Your Own Comp</span>
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Pick your own judge, invite friends, set the timer
          </p>
        </motion.div>

        {/* How it works */}
        <div className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            How It Works
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-surface-1 border border-border p-3 text-center">
              <div className="text-lg font-display text-violet-400 mb-1">1</div>
              <p className="text-[9px] text-muted-foreground">Create room</p>
            </div>
            <div className="bg-surface-1 border border-border p-3 text-center">
              <div className="text-lg font-display text-violet-400 mb-1">2</div>
              <p className="text-[9px] text-muted-foreground">Friends join</p>
            </div>
            <div className="bg-surface-1 border border-border p-3 text-center">
              <div className="text-lg font-display text-violet-400 mb-1">3</div>
              <p className="text-[9px] text-muted-foreground">Timer starts</p>
            </div>
            <div className="bg-surface-1 border border-border p-3 text-center">
              <div className="text-lg font-display text-violet-400 mb-1">4</div>
              <p className="text-[9px] text-muted-foreground">Judge picks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
