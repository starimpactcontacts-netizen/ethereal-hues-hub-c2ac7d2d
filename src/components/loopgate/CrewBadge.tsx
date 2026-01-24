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
      container: "h-6 px-2 gap-1.5",
      avatar: "w-4 h-4",
      icon: "w-3 h-3",
      text: "text-[10px]",
    },
    md: {
      container: "h-7 px-2.5 gap-1.5",
      avatar: "w-5 h-5",
      icon: "w-4 h-4",
      text: "text-xs",
    },
  };

  const s = sizeClasses[size];

  const content = (
    <span
      className={`inline-flex items-center bg-surface-1/80 border border-border/60 text-muted-foreground ${s.container} ${
        clickable ? "cursor-pointer hover:bg-surface-2 hover:border-border hover:text-foreground transition-all duration-150" : ""
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
      <span className={`${s.text} font-medium uppercase tracking-wider truncate max-w-[70px]`}>
        {crew.name}
      </span>
    </span>
  );

  if (clickable) {
    return (
      <span 
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/crews/${crew.id}`);
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
