import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Clock, Trophy, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriendlyTournament, CreateTournamentData } from "@/hooks/useFriendlyTournament";

interface CreateFriendlyTournamentProps {
  onBack: () => void;
  onCreated: (tournamentId: string) => void;
}

const playerOptions = [2, 4, 8, 16] as const;
const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 360, label: "6 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "24 hours" },
];

export default function CreateFriendlyTournament({ 
  onBack, 
  onCreated 
}: CreateFriendlyTournamentProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<2 | 4 | 8 | 16>(8);
  const [duration, setDuration] = useState(60);
  const [judgeUsername, setJudgeUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTournament } = useFriendlyTournament();

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const data: CreateTournamentData = {
        name: name.trim(),
        description: description.trim() || undefined,
        max_players: maxPlayers,
        duration_minutes: duration,
        judge_username: judgeUsername.trim() || undefined,
      };

      const tournamentId = await createTournament(data);
      if (tournamentId) {
        onCreated(tournamentId);
      }
    } finally {
      setIsSubmitting(false);
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
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="relative px-4 pt-5 pb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground">Create Friendly Comp</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Custom tournament, no stakes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 mt-4 space-y-6">
        {/* Name */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            Tournament Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Friday Night Edit Battle"
            className="bg-surface-1 border-border"
            maxLength={50}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            Description (optional)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Theme, rules, or vibes..."
            className="bg-surface-1 border-border"
            maxLength={200}
          />
        </div>

        {/* Max Players */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 block">
            <Users className="w-3.5 h-3.5 inline mr-2" />
            How Many Players?
          </label>
          <div className="grid grid-cols-4 gap-2">
            {playerOptions.map((count) => (
              <button
                key={count}
                onClick={() => setMaxPlayers(count)}
                className={`py-3 text-center border transition-all ${
                  maxPlayers === count
                    ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                    : 'bg-surface-1 border-border text-muted-foreground hover:border-violet-500/50'
                }`}
              >
                <span className="font-display text-lg">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 block">
            <Clock className="w-3.5 h-3.5 inline mr-2" />
            Submission Time
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

        {/* Judge */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-foreground mb-2 block">
            <User className="w-3.5 h-3.5 inline mr-2" />
            Assign Judge (optional)
          </label>
          <Input
            value={judgeUsername}
            onChange={(e) => setJudgeUsername(e.target.value)}
            placeholder="@username of your judge"
            className="bg-surface-1 border-border"
          />
          <p className="text-[10px] text-muted-foreground mt-2">
            Leave empty to judge it yourself or decide later
          </p>
        </div>

        {/* Info */}
        <div className="bg-surface-1 border border-border p-4">
          <h4 className="text-xs font-bold text-foreground mb-2">How It Works</h4>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li>• You create the comp, share the link or code</li>
            <li>• Friends join until room is full</li>
            <li>• Once live, everyone submits their edit</li>
            <li>• Judge picks winner — no XP, just glory</li>
          </ul>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || isSubmitting}
          className="w-full py-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-display uppercase tracking-wider"
        >
          {isSubmitting ? "Creating..." : "Create Tournament"}
        </Button>
      </div>
    </motion.div>
  );
}
