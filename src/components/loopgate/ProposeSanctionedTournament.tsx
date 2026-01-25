import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Users, Clock, Trophy, ChevronDown, FileText, Sparkles, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProposeTournament } from "@/hooks/useSanctionedTournaments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RivalCrew {
  id: string;
  name: string;
  avatar_url: string | null;
  member_count: number;
}

interface ProposeSanctionedTournamentProps {
  crewId: string;
  crewName: string;
  crewAvatarUrl: string | null;
  onBack: () => void;
  onSubmitted: () => void;
  rivals?: RivalCrew[];
  preselectedRival?: RivalCrew;
}

const formatOptions = [
  { value: "single_elimination", label: "Single Elimination" },
];

const playerOptions = [20, 32, 48, 64, 100];
const durationOptions = [
  { value: 24, label: "24 hours" },
  { value: 48, label: "48 hours" },
  { value: 72, label: "72 hours" },
  { value: 168, label: "1 week" },
];

export default function ProposeSanctionedTournament({
  crewId,
  crewName,
  crewAvatarUrl,
  onBack,
  onSubmitted,
  rivals = [],
  preselectedRival,
}: ProposeSanctionedTournamentProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(64);
  const [minPlayers, setMinPlayers] = useState(20);
  const [duration, setDuration] = useState(48);
  const [format, setFormat] = useState("single_elimination");
  const [rulesText, setRulesText] = useState("");
  
  // Tournament mode
  const [tournamentMode, setTournamentMode] = useState<"open" | "crew_vs_crew">(
    preselectedRival ? "crew_vs_crew" : "open"
  );
  const [selectedRival, setSelectedRival] = useState<RivalCrew | null>(preselectedRival || null);

  const { proposeTournament, submitting } = useProposeTournament();

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (tournamentMode === "crew_vs_crew" && !selectedRival) {
      return;
    }

    const rules = rulesText
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const id = await proposeTournament(crewId, crewName, crewAvatarUrl, {
      name: name.trim(),
      description: description.trim() || undefined,
      theme: theme.trim() || undefined,
      rules: rules.length > 0 ? rules : undefined,
      min_players: minPlayers,
      max_players: maxPlayers,
      duration_hours: duration,
      format_type: format,
      tournament_mode: tournamentMode,
      challenged_crew_id: selectedRival?.id,
      challenged_crew_name: selectedRival?.name,
      challenged_crew_avatar_url: selectedRival?.avatar_url,
    });

    if (id) {
      onSubmitted();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-32"
    >
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        <div className="relative px-4 pt-5 pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/30">
              <Shield className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground">Propose Sanctioned Tournament</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Submit for admin approval
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Crew Info */}
      <div className="px-4 mb-6">
        <div className="bg-surface-1 border border-gold/30 p-3 flex items-center gap-3">
          {crewAvatarUrl ? (
            <img src={crewAvatarUrl} alt={crewName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-gold" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-foreground">{crewName}</p>
            <p className="text-[10px] text-gold uppercase tracking-wider">Host Crew</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 space-y-5">
        {/* Tournament Mode Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            <Trophy className="w-3.5 h-3.5 inline mr-2" />
            Tournament Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setTournamentMode("open");
                setSelectedRival(null);
              }}
              className={`p-4 border transition-all ${
                tournamentMode === "open"
                  ? "bg-gold/10 border-gold text-gold"
                  : "bg-surface-1 border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase">Open</p>
              <p className="text-[10px] mt-1 opacity-70">Anyone can join</p>
            </button>
            <button
              type="button"
              onClick={() => setTournamentMode("crew_vs_crew")}
              className={`p-4 border transition-all ${
                tournamentMode === "crew_vs_crew"
                  ? "bg-red-500/10 border-red-500 text-red-400"
                  : "bg-surface-1 border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <Swords className="w-5 h-5 mx-auto mb-2" />
              <p className="text-xs font-bold uppercase">Crew vs Crew</p>
              <p className="text-[10px] mt-1 opacity-70">Challenge a rival</p>
            </button>
          </div>
        </div>

        {/* Rival Selection (only for crew_vs_crew mode) */}
        {tournamentMode === "crew_vs_crew" && (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
              <Swords className="w-3.5 h-3.5 inline mr-2" />
              Challenge Rival Crew *
            </label>
            {rivals.length === 0 ? (
              <div className="bg-surface-1 border border-red-500/30 p-4 text-center">
                <Swords className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No rivals to challenge</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Mark a crew as rival first from Rivals tab
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rivals.map((rival) => (
                  <button
                    key={rival.id}
                    type="button"
                    onClick={() => setSelectedRival(rival)}
                    className={`w-full p-3 flex items-center gap-3 border transition-all ${
                      selectedRival?.id === rival.id
                        ? "bg-red-500/10 border-red-500"
                        : "bg-surface-1 border-border hover:border-red-500/50"
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      {rival.avatar_url ? (
                        <AvatarImage src={rival.avatar_url} />
                      ) : (
                        <AvatarFallback className="bg-red-500/20 text-red-400">
                          <Shield className="w-4 h-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold">{rival.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {rival.member_count} members
                      </p>
                    </div>
                    {selectedRival?.id === rival.id && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <Swords className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            Tournament Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tournamentMode === "crew_vs_crew" 
              ? `e.g. ${crewName} vs ${selectedRival?.name || "Rival"} Showdown`
              : "e.g. Neon Nights Showdown"
            }
            className="bg-surface-1 border-border"
            maxLength={60}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this tournament about?"
            className="bg-surface-1 border-border min-h-[80px]"
            maxLength={500}
          />
        </div>

        {/* Theme */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            <Sparkles className="w-3.5 h-3.5 inline mr-2" />
            Edit Theme / Prompt
          </label>
          <Textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="What should editors create? Any restrictions?"
            className="bg-surface-1 border-border min-h-[60px]"
            maxLength={300}
          />
        </div>

        {/* Format */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            <Trophy className="w-3.5 h-3.5 inline mr-2" />
            Tournament Format
          </label>
          <div className="relative">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-surface-1 border border-border px-4 py-3 text-foreground appearance-none"
            >
              {formatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Player Counts */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
              <Users className="w-3.5 h-3.5 inline mr-2" />
              Min Players
            </label>
            <div className="relative">
              <select
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                className="w-full bg-surface-1 border border-border px-4 py-3 text-foreground appearance-none"
              >
                {[8, 12, 16, 20, 24, 32].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
              Max Players
            </label>
            <div className="relative">
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-surface-1 border border-border px-4 py-3 text-foreground appearance-none"
              >
                {playerOptions.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            <Clock className="w-3.5 h-3.5 inline mr-2" />
            Submission Duration
          </label>
          <div className="relative">
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-surface-1 border border-border px-4 py-3 text-foreground appearance-none"
            >
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Rules */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            <FileText className="w-3.5 h-3.5 inline mr-2" />
            Rules (one per line)
          </label>
          <Textarea
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            placeholder="No AI-generated content&#10;Must be original work&#10;30-90 second limit"
            className="bg-surface-1 border-border min-h-[100px] font-mono text-xs"
          />
        </div>

        {/* Info Box */}
        <div className={`border p-4 ${
          tournamentMode === "crew_vs_crew" 
            ? "bg-red-500/5 border-red-500/30" 
            : "bg-gold/5 border-gold/30"
        }`}>
          <h4 className={`text-xs font-bold mb-2 flex items-center gap-2 ${
            tournamentMode === "crew_vs_crew" ? "text-red-400" : "text-gold"
          }`}>
            {tournamentMode === "crew_vs_crew" ? (
              <Swords className="w-3.5 h-3.5" />
            ) : (
              <Shield className="w-3.5 h-3.5" />
            )}
            What Happens Next?
          </h4>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li>• Your proposal goes to admin review</li>
            {tournamentMode === "crew_vs_crew" && (
              <li>• Challenged crew will be notified to accept</li>
            )}
            <li>• If approved, admin sets Index point prizes</li>
            <li>• Tournament becomes visible in Arena → Sanctioned</li>
            {tournamentMode === "crew_vs_crew" ? (
              <li>• Only members of both crews can participate</li>
            ) : (
              <li>• Players can join and ready up</li>
            )}
            <li>• Winner gets Index points + XP</li>
          </ul>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={
            !name.trim() || 
            submitting || 
            (tournamentMode === "crew_vs_crew" && !selectedRival)
          }
          className={`w-full py-6 font-display uppercase tracking-wider ${
            tournamentMode === "crew_vs_crew"
              ? "bg-gradient-to-r from-red-500 via-red-400 to-red-500 text-white"
              : "bg-gradient-to-r from-gold via-amber-500 to-gold text-background"
          }`}
        >
          {submitting 
            ? "Submitting..." 
            : tournamentMode === "crew_vs_crew"
              ? "Issue Challenge"
              : "Submit Proposal"
          }
        </Button>
      </div>
    </motion.div>
  );
}