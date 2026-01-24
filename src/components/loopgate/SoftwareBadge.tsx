import { motion } from "framer-motion";

export const SOFTWARE_OPTIONS = [
  { id: 'after-effects', label: 'After Effects', short: 'AE' },
  { id: 'premiere', label: 'Adobe Premiere', short: 'Pr' },
  { id: 'final-cut', label: 'Final Cut Pro', short: 'FCP' },
  { id: 'davinci', label: 'DaVinci Resolve', short: 'DVR' },
  { id: 'vegas', label: 'Sony Vegas', short: 'Vegas' },
  { id: 'capcut', label: 'CapCut', short: 'CC' },
  { id: 'alight', label: 'Alight Motion', short: 'AM' },
  { id: 'vn', label: 'VN Editor', short: 'VN' },
  { id: 'cinema4d', label: 'Cinema 4D', short: 'C4D' },
] as const;

export type SoftwareId = typeof SOFTWARE_OPTIONS[number]['id'];

interface SoftwareBadgeProps {
  software: string;
  size?: 'sm' | 'md';
  animate?: boolean;
  index?: number;
}

export default function SoftwareBadge({ software, size = 'sm', animate = true, index = 0 }: SoftwareBadgeProps) {
  const softwareData = SOFTWARE_OPTIONS.find(s => s.id === software);
  
  if (!softwareData) return null;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
  };
  
  const badge = (
    <div 
      className={`inline-flex items-center rounded-full bg-surface-1 border border-border ${sizeClasses[size]}`}
    >
      <span className="font-medium tracking-wide text-muted-foreground">
        {softwareData.label}
      </span>
    </div>
  );
  
  if (!animate) return badge;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      {badge}
    </motion.div>
  );
}

interface SoftwareBadgesProps {
  software: string[];
  size?: 'sm' | 'md';
  animate?: boolean;
}

export function SoftwareBadges({ software, size = 'sm', animate = true }: SoftwareBadgesProps) {
  if (!software || software.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {software.map((sw, index) => (
        <SoftwareBadge 
          key={sw} 
          software={sw} 
          size={size} 
          animate={animate}
          index={index}
        />
      ))}
    </div>
  );
}
