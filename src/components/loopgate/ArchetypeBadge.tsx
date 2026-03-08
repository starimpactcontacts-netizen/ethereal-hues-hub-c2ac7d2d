import { motion } from "framer-motion";
import { Film, Music, Swords, Trophy, Gamepad2, Clapperboard, Laugh } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';

export const ARCHETYPES = [
  { id: 'film', label: 'Film Editor', icon: Film },
  { id: 'music', label: 'Music Editor', icon: Music },
  { id: 'anime', label: 'Anime Editor', icon: Swords },
  { id: 'sports', label: 'Sports Editor', icon: Trophy },
  { id: 'gaming', label: 'Gaming Editor', icon: Gamepad2 },
  { id: 'trailer', label: 'Trailer Editor', icon: Clapperboard },
  { id: 'abstract', label: 'Abstract / FX Editor', icon: Sparkles },
  { id: 'meme', label: 'Meme / Shortform Editor', icon: Laugh },
] as const;

export type ArchetypeId = typeof ARCHETYPES[number]['id'];

interface ArchetypeBadgeProps {
  archetype: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export default function ArchetypeBadge({ archetype, size = 'lg', animate = true }: ArchetypeBadgeProps) {
  const archetypeData = ARCHETYPES.find(a => a.id === archetype);
  
  if (!archetypeData) return null;
  
  const Icon = archetypeData.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };
  
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 16,
  };
  
  const badge = (
    <div 
      className={`inline-flex items-center rounded-full bg-surface-1 border border-border ${sizeClasses[size]}`}
    >
      <Icon size={iconSizes[size]} className="text-muted-foreground" />
      <span className="font-semibold tracking-wide text-foreground uppercase">
        {archetypeData.label}
      </span>
    </div>
  );
  
  if (!animate) return badge;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {badge}
    </motion.div>
  );
}
