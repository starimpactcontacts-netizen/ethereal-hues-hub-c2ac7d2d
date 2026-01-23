import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Swords, Users, Scale,
  Flame, Shield, Sparkles
} from "lucide-react";
import PracticeFormatCard, { PracticeFormat } from "./PracticeFormatCard";
import Practice1v1Flow from "./Practice1v1Flow";
import PracticeMatchView from "./PracticeMatchView";
import PracticeJudgeQueue from "./PracticeJudgeQueue";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeMatch } from "@/hooks/usePracticeMatch";
import { toast } from "sonner";

interface PracticeModeViewProps {
  onBack: () => void;
}

const practiceFormats = [
  {
    format: "1v1" as PracticeFormat,
    title: "1v1 Practice",
    description: "Get matched with similar skill. Both submit, judge picks winner.",
    icon: Swords,
    xpReward: "20-50",
    isAvailable: true,
  },
  {
    format: "crew-scrim" as PracticeFormat,
    title: "Crew vs Crew Scrim",
    description: "Challenge another crew to a friendly scrimmage. Coming soon.",
    icon: Users,
    xpReward: "40-80",
    isAvailable: false,
  },
  {
    format: "judge-drill" as PracticeFormat,
    title: "Judge Drill",
    description: "Get feedback from a certified judge. Coming soon.",
    icon: Scale,
    xpReward: "30",
    isAvailable: false,
  },
];

type ViewState = "menu" | "1v1-flow" | "match-view" | "judge-queue";

export default function PracticeModeView({ onBack }: PracticeModeViewProps) {
  const [viewState, setViewState] = useState<ViewState>("menu");
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const { isJudge } = useAuth();
  const { activeMatch } = usePracticeMatch();

  const handleFormatSelect = (format: PracticeFormat) => {
    if (format === "1v1") {
      // Check if user already has an active match
      if (activeMatch) {
        setActiveMatchId(activeMatch.id);
        setViewState("match-view");
      } else {
        setViewState("1v1-flow");
      }
    } else {
      toast.info("Coming soon!", {
        description: "This format is under development."
      });
    }
  };

  const handleMatchFound = (matchId: string) => {
    setActiveMatchId(matchId);
    setViewState("match-view");
  };

  // Render different views based on state
  if (viewState === "1v1-flow") {
    return (
      <Practice1v1Flow 
        onBack={() => setViewState("menu")} 
        onMatchFound={handleMatchFound}
      />
    );
  }

  if (viewState === "match-view" && activeMatchId) {
    return (
      <PracticeMatchView 
        matchId={activeMatchId}
        onBack={() => {
          setActiveMatchId(null);
          setViewState("menu");
        }}
      />
    );
  }

  if (viewState === "judge-queue") {
    return (
      <PracticeJudgeQueue onBack={() => setViewState("menu")} />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,hsl(var(--emerald-500)/0.08),transparent_50%)]" />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="relative px-4 pt-5 pb-6">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Back to Arena</span>
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-5 h-5 text-background" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-foreground tracking-wide">PRACTICE MODE</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Train, spar, and earn XP. No Index risk.
              </p>
            </div>
          </div>

          {/* Info badges */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">XP Rewards</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-1 border border-border px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">No Index Impact</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {/* Active Match Banner */}
        {activeMatch && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setActiveMatchId(activeMatch.id);
              setViewState("match-view");
            }}
            className="w-full bg-emerald-500/10 border border-emerald-500/50 p-4 mb-4 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Active Match</p>
                <p className="text-[10px] text-muted-foreground">
                  You have an ongoing 1v1 practice — tap to view
                </p>
              </div>
              <Swords className="w-5 h-5 text-emerald-400" />
            </div>
          </motion.button>
        )}

        {/* Section header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Choose Your Format
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>

        {/* Format cards */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {practiceFormats.map((format, index) => (
            <motion.div
              key={format.format}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PracticeFormatCard
                format={format.format}
                title={format.title}
                description={format.description}
                icon={format.icon}
                xpReward={format.xpReward}
                isAvailable={format.isAvailable}
                onSelect={() => handleFormatSelect(format.format)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Judge callout - only for judges */}
        {isJudge && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setViewState("judge-queue")}
            className="w-full mt-6 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 p-4 text-left"
          >
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground mb-1">Judge Queue</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tap to view and judge practice 1v1 matches. Earn +30 XP per judgment.
                </p>
              </div>
            </div>
          </motion.button>
        )}

        {/* How it works */}
        <div className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            How 1v1 Practice Works
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-surface-1 border border-border p-3 text-center">
              <div className="text-lg font-display text-emerald-400 mb-1">1</div>
              <p className="text-[9px] text-muted-foreground">Pick duration</p>
            </div>
            <div className="bg-surface-1 border border-border p-3 text-center">
              <div className="text-lg font-display text-emerald-400 mb-1">2</div>
              <p className="text-[9px] text-muted-foreground">Get matched</p>
            </div>
            <div className="bg-surface-1 border border-border p-3 text-center">
              <div className="text-lg font-display text-emerald-400 mb-1">3</div>
              <p className="text-[9px] text-muted-foreground">Both submit</p>
            </div>
            <div className="bg-surface-1 border border-border p-3 text-center">
              <div className="text-lg font-display text-emerald-400 mb-1">4</div>
              <p className="text-[9px] text-muted-foreground">Judge decides</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
