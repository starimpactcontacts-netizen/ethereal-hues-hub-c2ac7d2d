import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Swords, Users, Scale,
  Flame, Shield, Sparkles
} from "lucide-react";
import PracticeFormatCard, { PracticeFormat } from "./PracticeFormatCard";
import PracticeMatchmaking from "./PracticeMatchmaking";
import { toast } from "sonner";

interface PracticeModeViewProps {
  onBack: () => void;
}

const practiceFormats = [
  {
    format: "1v1" as PracticeFormat,
    title: "1v1 Practice",
    description: "Head-to-head editing battle. Get matched with a similar skill level opponent.",
    icon: Swords,
    xpReward: "25-50",
    isAvailable: true,
  },
  {
    format: "crew-scrim" as PracticeFormat,
    title: "Crew vs Crew Scrim",
    description: "Challenge another crew to a friendly scrimmage. Coordinate with your squad.",
    icon: Users,
    xpReward: "40-80",
    isAvailable: true,
  },
  {
    format: "judge-drill" as PracticeFormat,
    title: "Judge Drill",
    description: "Get feedback from a certified judge. Learn what the pros look for.",
    icon: Scale,
    xpReward: "30",
    isAvailable: true,
  },
];

export default function PracticeModeView({ onBack }: PracticeModeViewProps) {
  const [selectedFormat, setSelectedFormat] = useState<PracticeFormat | null>(null);
  const [showMatchmaking, setShowMatchmaking] = useState(false);

  const handleFormatSelect = (format: PracticeFormat) => {
    setSelectedFormat(format);
    setShowMatchmaking(true);
  };

  const handleMatchStart = () => {
    setShowMatchmaking(false);
    toast.success("Practice session started!", {
      description: "Good luck! XP will be awarded after completion."
    });
  };

  const formatTitle = practiceFormats.find(f => f.format === selectedFormat)?.title || "";

  return (
    <>
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

          {/* Judge callout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 p-4"
          >
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Judges Welcome</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Certified judges can join practice sessions to provide feedback and earn XP. 
                  Help others improve while sharpening your own eye.
                </p>
              </div>
            </div>
          </motion.div>

          {/* How it works */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              How Practice Works
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-1 border border-border p-3 text-center">
                <div className="text-lg font-display text-emerald-400 mb-1">1</div>
                <p className="text-[10px] text-muted-foreground">Pick a format</p>
              </div>
              <div className="bg-surface-1 border border-border p-3 text-center">
                <div className="text-lg font-display text-emerald-400 mb-1">2</div>
                <p className="text-[10px] text-muted-foreground">Get matched</p>
              </div>
              <div className="bg-surface-1 border border-border p-3 text-center">
                <div className="text-lg font-display text-emerald-400 mb-1">3</div>
                <p className="text-[10px] text-muted-foreground">Earn XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matchmaking overlay */}
      {showMatchmaking && selectedFormat && (
        <PracticeMatchmaking
          format={formatTitle}
          onCancel={() => setShowMatchmaking(false)}
          onStart={handleMatchStart}
        />
      )}
    </>
  );
}
