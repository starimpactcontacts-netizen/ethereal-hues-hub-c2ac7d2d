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
      avatar: "w-4 h-4",
      icon: "w-3 h-3",
      text: "text-[10px]",
    },
    md: {
      container: "h-7 px-2 gap-1.5",
      avatar: "w-5 h-5",
      icon: "w-4 h-4",
      text: "text-xs",
    },
  };

  const s = sizeClasses[size];

  const content = (
    <div
      className={`inline-flex items-center bg-gold/10 border border-gold/30 text-gold ${s.container} ${
        clickable ? "cursor-pointer hover:bg-gold/20 hover:border-gold/50 transition-colors" : ""
      }`}
    >
      {crew.avatar_url ? (
        <img
          src={crew.avatar_url}
          alt={crew.name}
          className={`${s.avatar} rounded-full object-cover`}
        />
      ) : (
        <IconComponent className={s.icon} />
      )}
      <span className={`${s.text} font-semibold uppercase tracking-wider truncate max-w-[80px]`}>
        {crew.name}
      </span>
    </div>
  );

  if (clickable) {
    return (
      <button onClick={() => navigate(`/crews/${crew.id}`)} className="inline-block">
        {content}
      </button>
    );
  }

  return content;
}
