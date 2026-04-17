import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const ARENA_CARD_CLASS = "w-[176px] h-[176px] shrink-0";
export const ARENA_RAIL_CLASS = "flex items-start gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 snap-x snap-mandatory";

export function ArenaRail({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(ARENA_RAIL_CLASS, className)}>{children}</div>;
}

export function ArenaRailCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(ARENA_CARD_CLASS, "snap-start", className)}>{children}</div>;
}

export function ArenaRailSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ArenaRail>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(ARENA_CARD_CLASS, "rounded-2xl bg-surface-1 animate-pulse snap-start")}
        />
      ))}
    </ArenaRail>
  );
}