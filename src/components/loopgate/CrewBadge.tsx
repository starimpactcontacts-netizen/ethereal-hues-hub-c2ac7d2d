import { useNavigate } from "react-router-dom";
import { Shield, Crown, Users, Star, Zap, Award } from "lucide-react";

interface CrewBadgeProps {
  crew: {
    id: string;
    name: string;
    emblem: string;
    avatar_url?: string | null;
  };
  size?: "sm" | "md";
  clickable?: boolean;
}

const emblemIcons: Record<string, typeof Shield> = {
  shield: Shield,
  crown: Crown,
  users: Users,
  star: Star,
  zap: Zap,
  award: Award,
};

export default function CrewBadge({ crew, size = "sm", clickable = true }: CrewBadgeProps) {
  const navigate = useNavigate();
  const IconComponent = emblemIcons[crew.emblem] || Shield;
  
  const sizeClasses = {
    sm: {
      container: "h-5 px-1.5 gap-1",
      avatar: "w-3.5 h-3.5",
      icon: "w-2.5 h-2.5",
      text: "text-[9px]",
    },
    md: {
      container: "h-6 px-2 gap-1.5",
      avatar: "w-4 h-4",
      icon: "w-3 h-3",
      text: "text-[10px]",
    },
  };

  const s = sizeClasses[size];

  const content = (
    <span
      className={`inline-flex items-center rounded-full bg-background/60 border border-white/[0.06] shadow-[0_0_6px_rgba(255,255,255,0.04)] text-muted-foreground ${s.container} ${
        clickable ? "cursor-pointer hover:bg-surface-2 hover:border-white/10 hover:text-foreground transition-all duration-150" : ""
      }`}
    >
      {crew.avatar_url ? (
        <img
          src={crew.avatar_url}
          alt={crew.name}
          className={`${s.avatar} rounded-full object-cover border border-border/50`}
        />
      ) : (
        <IconComponent className={`${s.icon} text-muted-foreground/70`} />
      )}
      <span className={`${s.text} font-medium tracking-wider truncate max-w-[60px]`}>
        {crew.name}
      </span>
    </span>
  );

  if (clickable) {
    return (
      <span 
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/units/${crew.id}`);
        }} 
        className="inline-block"
        role="button"
        tabIndex={0}
      >
        {content}
      </span>
    );
  }

  return content;
}
