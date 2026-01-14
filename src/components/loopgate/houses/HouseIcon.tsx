import { 
  Crown, Skull, Sun, BookOpen, Triangle, 
  Sparkles, Star, Headphones, Bird, Ghost 
} from "lucide-react";
import { CSSProperties } from "react";

interface HouseIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const iconMap: Record<string, typeof Crown> = {
  "broken-crown": Crown,
  "wolf": Skull,
  "sunburst": Sun,
  "rune-book": BookOpen,
  "fractured-triangle": Triangle,
  "prism": Sparkles,
  "shooting-star": Star,
  "skull-headphones": Headphones,
  "crowned-eagle": Bird,
  "white-mask": Ghost,
};

export default function HouseIcon({ symbol, size = 24, className = "", style }: HouseIconProps) {
  const IconComponent = iconMap[symbol] || Crown;
  return <IconComponent size={size} className={className} style={style} />;
}
