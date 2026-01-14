import { 
  Crown, Skull, Sun, BookOpen, Triangle, 
  Sparkles, Star, Headphones, Ghost 
} from "lucide-react";
import { CSSProperties } from "react";

interface HouseIconProps {
  symbol: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

// Phoenix SVG component for House Apex
function Phoenix({ size, className, style }: { size: number; className?: string; style?: CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      className={className}
      style={style}
      fill="currentColor"
    >
      <path d="M12 2C12 2 14 4 14 7C14 9 13 10 12 11C11 10 10 9 10 7C10 4 12 2 12 2Z"/>
      <path d="M12 11C12 11 15 12 17 15C18.5 17.5 18 20 17 21C15.5 19 14 18 12 18C10 18 8.5 19 7 21C6 20 5.5 17.5 7 15C9 12 12 11 12 11Z"/>
      <path d="M6 8C6 8 4 10 4 13C4 15 5 16 6 16.5C6.5 15 7 14 8 13C8 11 7 9 6 8Z"/>
      <path d="M18 8C18 8 20 10 20 13C20 15 19 16 18 16.5C17.5 15 17 14 16 13C16 11 17 9 18 8Z"/>
      <path d="M12 18C12 18 11 20 11 22L12 23L13 22C13 20 12 18 12 18Z"/>
    </svg>
  );
}

// Crown SVG component for House of Cartel
function MinimalCrown({ size, className, style }: { size: number; className?: string; style?: CSSProperties }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 17L4 7L8 11L12 4L16 11L20 7L22 17H2Z"/>
      <path d="M2 17H22V20H2V17Z"/>
    </svg>
  );
}

export default function HouseIcon({ symbol, size = 24, className = "", style }: HouseIconProps) {
  // Map symbols to components
  switch (symbol) {
    case "crowned-eagle":
      return <Phoenix size={size} className={className} style={style} />;
    case "broken-crown":
      return <MinimalCrown size={size} className={className} style={style} />;
    case "wolf":
      return <Skull size={size} className={className} style={style} />;
    case "sunburst":
      return <Sun size={size} className={className} style={style} />;
    case "rune-book":
      return <BookOpen size={size} className={className} style={style} />;
    case "fractured-triangle":
      return <Triangle size={size} className={className} style={style} />;
    case "prism":
      return <Sparkles size={size} className={className} style={style} />;
    case "shooting-star":
      return <Star size={size} className={className} style={style} />;
    case "skull-headphones":
      return <Headphones size={size} className={className} style={style} />;
    case "white-mask":
      return <Ghost size={size} className={className} style={style} />;
    default:
      return <Crown size={size} className={className} style={style} />;
  }
}
