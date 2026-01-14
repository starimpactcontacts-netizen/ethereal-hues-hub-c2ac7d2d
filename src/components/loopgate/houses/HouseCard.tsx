import { motion } from "framer-motion";
import { Users, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import HouseIcon from "./HouseIcon";

interface House {
  id: string;
  name: string;
  type: string;
  symbol: string;
  primary_color: string;
  secondary_color: string;
  description: string;
  lore?: string;
  member_count: number;
  avg_qoi?: number;
  prestige_level: number;
  requires_approval: boolean;
  house_index?: number;
}

interface HouseCardProps {
  house: House;
  userHouseId?: string | null;
  pendingApplicationId?: string | null;
  onApply: (houseId: string) => void;
  onViewDetails: (houseId: string) => void;
  isApplying?: boolean;
}

export default function HouseCard({
  house,
  userHouseId,
  pendingApplicationId,
  onApply,
  onViewDetails,
  isApplying,
}: HouseCardProps) {
  const isPrestige = house.type === "prestige";
  const isMember = userHouseId === house.id;
  const hasPendingApplication = pendingApplicationId === house.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg border bg-card"
      style={{
        borderColor: isMember ? "hsl(var(--gold))" : "hsl(var(--border))",
      }}
    >
      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(ellipse at top, hsl(var(--gold)), transparent 70%)`,
        }}
      />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center bg-muted/50"
              style={{
                border: `1px solid hsl(var(--gold) / 0.3)`,
              }}
            >
              <HouseIcon 
                symbol={house.symbol} 
                size={28} 
                className="text-gold"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wide">
                  {house.name}
                </h3>
                {isPrestige && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-gold/50 text-gold bg-gold/10">
                    Prestige
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 italic">
                "{house.description}"
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{house.member_count}</span>
          </div>
          {house.house_index !== undefined && house.house_index > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gold">◆</span>
              <span className="text-gold font-mono">{house.house_index.toLocaleString()} Index</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isMember ? (
            <div className="flex-1 py-2 px-3 text-xs font-semibold uppercase text-center rounded border border-gold/50 bg-gold/10 text-gold">
              Your House
            </div>
          ) : isPrestige ? (
            <Button 
              disabled 
              variant="outline"
              className="flex-1 text-xs font-semibold uppercase border-gold/50 text-gold bg-background hover:bg-background"
            >
              Invite Only
            </Button>
          ) : hasPendingApplication ? (
            <div className="flex-1 py-2 px-3 text-xs font-semibold uppercase text-center rounded bg-muted text-muted-foreground flex items-center justify-center gap-1">
              <Clock size={12} />
              Pending
            </div>
          ) : userHouseId ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs border-muted"
              disabled
            >
              Already in a House
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs font-semibold border-gold/30 text-foreground hover:bg-gold/10 hover:border-gold/50"
              onClick={() => onApply(house.id)}
              disabled={isApplying}
            >
              Apply
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="px-2 text-muted-foreground hover:text-foreground"
            onClick={() => onViewDetails(house.id)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
