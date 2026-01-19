import { Shield, Users, Swords, X, TrendingUp, TrendingDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CrewRivalCardProps {
  rivalry: {
    id: string;
    rival_crew?: {
      id: string;
      name: string;
      avatar_url: string | null;
      member_count: number;
      emblem: string;
    };
  };
  ownCrewXP: number;
  rivalXP?: number;
  isStaff: boolean;
  onRemove: (rivalryId: string) => void;
}

export default function CrewRivalCard({ 
  rivalry, 
  ownCrewXP, 
  rivalXP = 0, 
  isStaff, 
  onRemove 
}: CrewRivalCardProps) {
  const navigate = useNavigate();
  const rival = rivalry.rival_crew;
  
  if (!rival) return null;

  const isAhead = ownCrewXP > rivalXP;
  const xpDiff = Math.abs(ownCrewXP - rivalXP);

  return (
    <div className="relative group">
      <div 
        className="flex items-center gap-3 p-3 bg-surface-1 border border-red-500/20 rounded-lg hover:border-red-500/40 transition-colors cursor-pointer"
        onClick={() => navigate(`/crews/${rival.id}`)}
      >
        {/* Rivalry Icon */}
        <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <Swords className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Avatar */}
        <Avatar className="w-10 h-10 border-2 border-red-500/30">
          {rival.avatar_url ? (
            <AvatarImage src={rival.avatar_url} />
          ) : (
            <AvatarFallback className="bg-red-500/10 text-red-400">
              <Shield className="w-5 h-5" />
            </AvatarFallback>
          )}
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{rival.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {rival.member_count}
            </span>
            <span>•</span>
            <span className={isAhead ? "text-green-400" : "text-red-400"}>
              {isAhead ? (
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  +{xpDiff.toLocaleString()} XP ahead
                </span>
              ) : (
                <span className="flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  {xpDiff.toLocaleString()} XP behind
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Remove Button */}
        {isStaff && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(rivalry.id);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
