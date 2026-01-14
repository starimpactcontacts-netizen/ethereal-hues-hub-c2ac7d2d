import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HouseAvatarRingProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string;
  house?: {
    primary_color: string;
    secondary_color: string;
    name: string;
  } | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8", ring: 2, avatar: "w-7 h-7" },
  md: { container: "w-12 h-12", ring: 2, avatar: "w-10 h-10" },
  lg: { container: "w-20 h-20", ring: 3, avatar: "w-[72px] h-[72px]" },
  xl: { container: "w-28 h-28", ring: 4, avatar: "w-24 h-24" },
};

export default function HouseAvatarRing({
  avatarUrl,
  displayName,
  username,
  house,
  size = "md",
  className = "",
}: HouseAvatarRingProps) {
  const s = sizeMap[size];
  const initial = (displayName || username || "?")[0].toUpperCase();

  if (!house) {
    return (
      <Avatar className={`${s.avatar} ${className}`}>
        <AvatarImage src={avatarUrl || undefined} alt={displayName || username} />
        <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div
      className={`${s.container} rounded-full flex items-center justify-center ${className}`}
      style={{
        background: `linear-gradient(135deg, ${house.primary_color}, ${house.secondary_color})`,
        padding: s.ring,
      }}
      title={house.name}
    >
      <Avatar className={`${s.avatar} border-2 border-background`}>
        <AvatarImage src={avatarUrl || undefined} alt={displayName || username} />
        <AvatarFallback className="bg-background text-foreground font-semibold">
          {initial}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
