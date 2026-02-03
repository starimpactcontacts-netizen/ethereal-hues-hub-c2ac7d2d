import { Award, Star, Zap, UserPlus, Gavel } from "lucide-react";

type ExtendedRole = "ace_editor" | "veteran" | "challenger" | "recruiter" | "judge" | null;

interface CrewExtendedRoleBadgeProps {
  role: ExtendedRole;
  size?: "sm" | "md";
}

const ROLE_CONFIG: Record<
  Exclude<ExtendedRole, null>,
  {
    label: string;
    icon: React.ReactNode;
    colors: string;
    description: string;
  }
> = {
  ace_editor: {
    label: "Ace",
    icon: <Star className="w-3 h-3" />,
    colors: "bg-gold/20 text-gold border-gold/30",
    description: "Top performer in the crew",
  },
  veteran: {
    label: "Veteran",
    icon: <Award className="w-3 h-3" />,
    colors: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "Long-standing unit member",
  },
  challenger: {
    label: "Challenger",
    icon: <Zap className="w-3 h-3" />,
    colors: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    description: "Always pushing limits",
  },
  recruiter: {
    label: "Recruiter",
    icon: <UserPlus className="w-3 h-3" />,
    colors: "bg-green-500/20 text-green-400 border-green-500/30",
    description: "Brings new members",
  },
  judge: {
    label: "Judge",
    icon: <Gavel className="w-3 h-3" />,
    colors: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "Official judge in the crew",
  },
};

export default function CrewExtendedRoleBadge({ role, size = "sm" }: CrewExtendedRoleBadgeProps) {
  if (!role) return null;

  const config = ROLE_CONFIG[role];
  if (!config) return null;

  const sizeClasses = size === "sm" 
    ? "px-1.5 py-0.5 text-[10px] gap-1" 
    : "px-2 py-1 text-xs gap-1.5";

  return (
    <div 
      className={`inline-flex items-center rounded-full border font-medium ${config.colors} ${sizeClasses}`}
      title={config.description}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}
