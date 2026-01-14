import { motion } from "framer-motion";
import { Users, ChevronRight, Lock, Clock } from "lucide-react";
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
      className="relative overflow-hidden rounded-lg border border-border bg-card"
      style={{
        borderColor: isMember ? house.primary_color : undefined,
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(ellipse at top, ${house.primary_color}40, transparent 70%)`,
        }}
      />

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${house.primary_color}30, ${house.secondary_color}30)`,
                border: `1px solid ${house.primary_color}50`,
              }}
            >
              <HouseIcon 
                symbol={house.symbol} 
                size={28} 
                className="opacity-90"
                style={{ color: house.primary_color }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wide">
                  {house.name}
                </h3>
                {isPrestige && (
                  <Lock size={12} className="text-gold" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {house.description}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{house.member_count} members</span>
          </div>
          {house.avg_qoi && house.avg_qoi > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gold">◆</span>
              <span>{house.avg_qoi.toFixed(1)} avg QOI</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isMember ? (
            <div 
              className="flex-1 py-2 px-3 text-xs font-semibold uppercase text-center rounded"
              style={{ 
                backgroundColor: `${house.primary_color}20`,
                color: house.primary_color,
              }}
            >
              Your House
            </div>
          ) : isPrestige ? (
            <div className="flex-1 py-2 px-3 text-xs font-semibold uppercase text-center rounded bg-muted text-muted-foreground">
              Invite Only
            </div>
          ) : hasPendingApplication ? (
            <div className="flex-1 py-2 px-3 text-xs font-semibold uppercase text-center rounded bg-yellow-500/20 text-yellow-500 flex items-center justify-center gap-1">
              <Clock size={12} />
              Pending
            </div>
          ) : userHouseId ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-xs"
              disabled
            >
              Already in a House
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 text-xs font-semibold"
              style={{
                backgroundColor: house.primary_color,
                color: house.secondary_color === "#0A0A0A" || house.secondary_color === "#1A1A1A" ? "#000" : "#fff",
              }}
              onClick={() => onApply(house.id)}
              disabled={isApplying}
            >
              {house.requires_approval ? "Apply" : "Join"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={() => onViewDetails(house.id)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
