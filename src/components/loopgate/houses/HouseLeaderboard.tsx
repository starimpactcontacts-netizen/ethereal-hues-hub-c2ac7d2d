import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, TrendingUp } from "lucide-react";
import HouseIcon from "./HouseIcon";

interface HouseWithStats {
  id: string;
  name: string;
  symbol: string;
  primary_color: string;
  secondary_color: string;
  type: string;
  member_count: number;
  house_index: number;
  avg_qoi: number;
}

interface HouseLeaderboardProps {
  houses: HouseWithStats[];
}

export default function HouseLeaderboard({ houses }: HouseLeaderboardProps) {
  const navigate = useNavigate();
  
  // Sort by house_index descending
  const rankedHouses = [...houses].sort((a, b) => b.house_index - a.house_index);
  
  // Calculate max index for glow intensity
  const maxIndex = rankedHouses[0]?.house_index || 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Trophy size={14} className="text-gold" />
          House Rankings
        </h2>
      </div>
      
      <div className="space-y-2">
        {rankedHouses.map((house, index) => {
          const glowIntensity = house.house_index > 0 ? (house.house_index / maxIndex) : 0;
          const isTop3 = index < 3;
          
          return (
            <motion.button
              key={house.id}
              onClick={() => navigate(`/houses/${house.id}`)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-full relative overflow-hidden rounded-lg border bg-card p-3 text-left transition-all hover:border-gold/30"
              style={{
                borderColor: isTop3 ? `hsl(var(--gold) / ${0.3 + glowIntensity * 0.4})` : undefined,
              }}
            >
              {/* Glow effect based on wealth */}
              {glowIntensity > 0.3 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at left, hsl(var(--gold) / ${glowIntensity * 0.15}), transparent 60%)`,
                  }}
                />
              )}
              
              <div className="relative flex items-center gap-3">
                {/* Rank */}
                <div className={`w-6 text-center font-display text-lg ${
                  index === 0 ? 'text-gold' : 
                  index === 1 ? 'text-gray-400' : 
                  index === 2 ? 'text-amber-700' : 
                  'text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                
                {/* Icon with glow */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 relative"
                  style={{
                    border: `1px solid hsl(var(--gold) / ${0.2 + glowIntensity * 0.5})`,
                    boxShadow: glowIntensity > 0.5 ? `0 0 20px hsl(var(--gold) / ${glowIntensity * 0.3})` : undefined,
                  }}
                >
                  <HouseIcon symbol={house.symbol} size={22} className="text-gold" />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-sm uppercase tracking-wide truncate">
                      {house.name}
                    </span>
                    {house.type === 'prestige' && (
                      <span className="text-[8px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded border border-gold/50 text-gold bg-gold/10">
                        P
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={10} />
                      {house.member_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={10} />
                      {house.avg_qoi.toFixed(1)} avg
                    </span>
                  </div>
                </div>
                
                {/* Total Index */}
                <div className="text-right">
                  <div className="text-gold font-mono font-semibold text-sm">
                    {house.house_index.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-muted-foreground uppercase">Index</div>
                </div>
              </div>
            </motion.button>
          );
        })}
        
        {rankedHouses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No houses yet
          </div>
        )}
      </div>
    </div>
  );
}
