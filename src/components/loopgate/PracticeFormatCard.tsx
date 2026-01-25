import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export type PracticeFormat = "get-feedback" | "friendly-comp" | "crew-scrim";

interface PracticeFormatCardProps {
  format: PracticeFormat;
  title: string;
  description: string;
  icon: LucideIcon;
  xpReward: string;
  isAvailable?: boolean;
  onSelect: () => void;
}

export default function PracticeFormatCard({
  title,
  description,
  icon: Icon,
  xpReward,
  isAvailable = true,
  onSelect,
}: PracticeFormatCardProps) {
  return (
    <motion.button
      whileHover={{ scale: isAvailable ? 1.02 : 1 }}
      whileTap={{ scale: isAvailable ? 0.98 : 1 }}
      onClick={isAvailable ? onSelect : undefined}
      className={`w-full text-left bg-surface-1 border transition-all p-4 ${
        isAvailable 
          ? "border-border hover:border-emerald-500/50 cursor-pointer" 
          : "border-border/50 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isAvailable 
            ? "bg-emerald-500/20 border border-emerald-500/30" 
            : "bg-muted/20 border border-border"
        }`}>
          <Icon className={`w-5 h-5 ${isAvailable ? "text-emerald-400" : "text-muted-foreground"}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-display text-sm text-foreground">{title}</h3>
            {xpReward !== "—" ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5">
                +{xpReward} XP
              </span>
            ) : (
              <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5">
                No XP
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      
      {!isAvailable && (
        <div className="mt-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
          Coming Soon
        </div>
      )}
    </motion.button>
  );
}
