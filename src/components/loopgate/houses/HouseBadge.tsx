import { useNavigate } from "react-router-dom";
import HouseIcon from "./HouseIcon";

interface HouseBadgeProps {
  house: {
    id: string;
    name: string;
    symbol: string;
    primary_color: string;
    secondary_color: string;
  };
  size?: "sm" | "md";
  clickable?: boolean;
  showName?: boolean;
}

export default function HouseBadge({ 
  house, 
  size = "sm", 
  clickable = true,
  showName = true 
}: HouseBadgeProps) {
  const navigate = useNavigate();
  
  const sizeClasses = {
    sm: {
      container: "h-5 px-1.5 gap-1",
      icon: 14,
      text: "text-[10px]",
    },
    md: {
      container: "h-7 px-2 gap-1.5",
      icon: 18,
      text: "text-xs",
    },
  };

  const s = sizeClasses[size];

  const content = (
    <div
      className={`inline-flex items-center border ${s.container} ${
        clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      }`}
      style={{
        backgroundColor: `${house.primary_color}15`,
        borderColor: `${house.primary_color}50`,
        color: house.primary_color,
      }}
    >
      <HouseIcon symbol={house.symbol} size={s.icon} />
      {showName && (
        <span className={`${s.text} font-semibold uppercase tracking-wider truncate max-w-[80px]`}>
          {house.name.replace('House ', '').replace(' of ', '')}
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <button onClick={() => navigate(`/houses/${house.id}`)} className="inline-block">
        {content}
      </button>
    );
  }

  return content;
}
