import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, X, Zap, Swords, Shield, Globe, Target, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import LoopMonster from "@/components/loopgate/LoopMonster";
import PracticeModeView from "@/components/loopgate/PracticeModeView";
import { useHostedCompetitions } from "@/hooks/useHostedCompetitions";
import { useSanctionedTournaments } from "@/hooks/useSanctionedTournaments";
import { useBattles } from "@/hooks/useBattles";
import CreateBattleModal from "@/components/loopgate/CreateBattleModal";
import { Input } from "@/components/ui/input";

interface Event {
  id: string;
  title: string;
  subtitle: string | null;
  status: string;
  start_date: string;
  end_date: string;
  poster_url: string | null;
  prize_pool: string | null;
  league: string;
  event_mode: string | null;
  xp_reward: number | null;
}

// Reusable game-card component (Roblox style)
function GameCard({ 
  label, icon, color, gradient, onClick, live, stat 
}: { 
  label: string; 
  icon: React.ReactNode; 
  color: string; 
  gradient: string; 
  onClick: () => void; 
  live?: number; 
  stat?: string;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-start gap-1.5 shrink-0 w-[140px]"
    >
      <div className={`w-[140px] h-[140px] rounded-2xl ${gradient} flex items-center justify-center relative overflow-hidden`}>
        {live && live > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold text-white">{live}</span>
          </div>
        )}
        <div className="w-12 h-12">{icon}</div>
      </div>
      <p className="text-xs font-semibold text-foreground truncate w-full text-left">{label}</p>
      {stat && <p className="text-[10px] text-muted-foreground -mt-1">{stat}</p>}
    </motion.button>
  );
}

// Row with title + horizontal scroll
function GameRow({ title, children, onSeeAll }: { title: string; children: React.ReactNode; onSeeAll?: () => void }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-4">
        <h2 className="font-display text-base text-foreground tracking-wide">{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="text-[11px] text-muted-foreground font-medium">See All</button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
        {children}
      </div>
    </div>
  );
}

export default function ArenaPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [showCreateBattle, setShowCreateBattle] = useState(false);

  const { tournaments: sanctionedTournaments } = useSanctionedTournaments(
    ["approved", "ready_up", "live", "bracket", "completed"]
  );
  const { battles } = useBattles(["pending", "active", "judging", "completed"]);
  const { competitions: hostedComps } = useHostedCompetitions();

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase.from("events").select("*").order("start_date", { ascending: true });
      if (data) setEvents(data);
    }
    fetchEvents();
  }, []);

  const liveBattles = battles.filter(b => b.status === "active" || b.status === "judging").length;
  const liveTournaments = sanctionedTournaments.filter(t => ["live", "bracket", "ready_up"].includes(t.status)).length;
  const liveHosted = hostedComps.filter(c => c.status === "live" || c.status === "judging").length;
  const activeBattles = battles.filter(b => ["active", "judging", "pending"].includes(b.status));

  if (showPracticeMode) {
    return <PracticeModeView onBack={() => setShowPracticeMode(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <LoopMonster />

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="font-display text-2xl text-foreground tracking-wide mb-3">ARENA</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-8 bg-muted border-border rounded-full text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {!searchQuery ? (
        <div className="space-y-5">
          {/* Popular — main modes */}
          <GameRow title="Popular">
            <GameCard
              label="Quick 1v1"
              icon={<Zap className="w-10 h-10 text-white" />}
              color="red"
              gradient="bg-gradient-to-br from-red-600 to-red-800"
              onClick={() => navigate('/hub')}
              stat="⚡ Instant • +20 IDX"
            />
            <GameCard
              label="1v1 Battle"
              icon={<Swords className="w-10 h-10 text-white" />}
              color="red"
              gradient="bg-gradient-to-br from-rose-600 to-rose-900"
              onClick={() => profile ? setShowCreateBattle(true) : navigate('/start')}
              live={liveBattles}
              stat="Challenge anyone"
            />
            <GameCard
              label="Official Events"
              icon={<Trophy className="w-10 h-10 text-white" />}
              color="gold"
              gradient="bg-gradient-to-br from-amber-500 to-amber-800"
              onClick={() => navigate('/events')}
              live={events.filter(e => e.status === "live").length}
              stat="Loopgate-run"
            />
            <GameCard
              label="Sanctioned"
              icon={<Shield className="w-10 h-10 text-white" />}
              color="gold"
              gradient="bg-gradient-to-br from-yellow-600 to-yellow-900"
              onClick={() => {}}
              live={liveTournaments}
              stat="Unit tournaments"
            />
            <GameCard
              label="Hosted Comps"
              icon={<Globe className="w-10 h-10 text-white" />}
              color="cyan"
              gradient="bg-gradient-to-br from-cyan-500 to-cyan-800"
              onClick={() => navigate('/hosted-comps')}
              live={liveHosted}
              stat="Community"
            />
            <GameCard
              label="Practice"
              icon={<Target className="w-10 h-10 text-white" />}
              color="green"
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-800"
              onClick={() => setShowPracticeMode(true)}
              stat="Train • No risk"
            />
          </GameRow>

          {/* Live Battles row */}
          {activeBattles.length > 0 && (
            <GameRow title="Live Battles">
              {activeBattles.slice(0, 10).map((battle) => (
                <GameCard
                  key={battle.id}
                  label={`${battle.challenger_username} vs ${battle.opponent_username || '???'}`}
                  icon={<Swords className="w-8 h-8 text-white/80" />}
                  color="red"
                  gradient="bg-gradient-to-br from-red-700/80 to-red-950"
                  onClick={() => navigate(`/battle/${battle.id}`)}
                  stat={battle.status === "judging" ? "⚖️ Judging" : "🔴 Live"}
                />
              ))}
            </GameRow>
          )}

          {/* Sanctioned Tournaments row */}
          {sanctionedTournaments.length > 0 && (
            <GameRow title="Tournaments">
              {sanctionedTournaments.map((t) => (
                <GameCard
                  key={t.id}
                  label={t.name}
                  icon={<Shield className="w-8 h-8 text-white/80" />}
                  color="gold"
                  gradient="bg-gradient-to-br from-amber-700/80 to-amber-950"
                  onClick={() => navigate(`/sanctioned/${t.id}`)}
                  live={["live", "bracket", "ready_up"].includes(t.status) ? 1 : undefined}
                  stat={t.status}
                />
              ))}
            </GameRow>
          )}

          {/* Hosted Comps row */}
          {hostedComps.filter(c => c.status === "live" || c.status === "judging" || c.status === "upcoming").length > 0 && (
            <GameRow title="Community Comps" onSeeAll={() => navigate('/hosted-comps')}>
              {hostedComps
                .filter(c => c.status === "live" || c.status === "judging" || c.status === "upcoming")
                .slice(0, 10)
                .map((comp) => (
                  <GameCard
                    key={comp.id}
                    label={comp.name}
                    icon={<Globe className="w-8 h-8 text-white/80" />}
                    color="cyan"
                    gradient="bg-gradient-to-br from-cyan-700/80 to-cyan-950"
                    onClick={() => navigate(`/hosted-comp/${comp.id}`)}
                    live={comp.status === "live" ? 1 : undefined}
                    stat={comp.status}
                  />
                ))}
            </GameRow>
          )}
        </div>
      ) : (
        /* Search results */
        <div className="px-4 space-y-2">
          {events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).map(e => (
            <button key={e.id} onClick={() => navigate(`/event/${e.id}`)} className="w-full flex items-center gap-3 p-3 bg-muted rounded-xl border border-border text-left">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                <p className="text-[10px] text-muted-foreground">{e.status}</p>
              </div>
            </button>
          ))}
          {sanctionedTournaments.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => (
            <button key={t.id} onClick={() => navigate(`/sanctioned/${t.id}`)} className="w-full flex items-center gap-3 p-3 bg-muted rounded-xl border border-border text-left">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.status}</p>
              </div>
            </button>
          ))}
          {events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
           sanctionedTournaments.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nothing found</p>
            </div>
          )}
        </div>
      )}

      <CreateBattleModal
        isOpen={showCreateBattle}
        onClose={() => setShowCreateBattle(false)}
        onSuccess={(battleId) => {
          setShowCreateBattle(false);
          navigate(`/battle/${battleId}`);
        }}
      />
    </div>
  );
}
