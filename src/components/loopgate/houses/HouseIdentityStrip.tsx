import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import HouseIcon from "./HouseIcon";

interface HouseIdentityStripProps {
  house: {
    id: string;
    name: string;
    symbol: string;
    primary_color: string;
    secondary_color: string;
  };
  size?: "sm" | "md" | "lg";
}

export default function HouseIdentityStrip({ house, size = "md" }: HouseIdentityStripProps) {
  const navigate = useNavigate();
  
  const sizeConfig = {
    sm: { height: 'h-6', icon: 14, text: 'text-[10px]', px: 'px-2' },
    md: { height: 'h-8', icon: 18, text: 'text-xs', px: 'px-3' },
    lg: { height: 'h-10', icon: 22, text: 'text-sm', px: 'px-4' },
  };
  
  const s = sizeConfig[size];

  return (
    <motion.button
      onClick={() => navigate(`/houses/${house.id}`)}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full ${s.height} rounded overflow-hidden group`}
      style={{
        background: `linear-gradient(90deg, ${house.primary_color}30, ${house.secondary_color}15, transparent)`,
      }}
    >
      {/* Color accent line on left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: house.primary_color }}
      />
      
      {/* Content */}
      <div className={`relative h-full flex items-center gap-2 ${s.px} pl-4`}>
        <HouseIcon 
          symbol={house.symbol} 
          size={s.icon} 
          style={{ color: house.primary_color }}
        />
        <span 
          className={`${s.text} font-display font-semibold uppercase tracking-wider`}
          style={{ color: house.primary_color }}
        >
          {house.name}
        </span>
        
        {/* Hover arrow */}
        <span className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          →
        </span>
      </div>
    </motion.button>
  );
}
