import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const ARENA_RAIL_PADDING = 16;
export const ARENA_RAIL_GAP = 16;
export const ARENA_CARD_WIDTH = 176;
export const ARENA_CARD_HEIGHT = 176;

export const ARENA_CARD_CLASS = "shrink-0 snap-start";
export const ARENA_RAIL_CLASS = "overflow-x-auto scrollbar-hide snap-x snap-mandatory";

export function ArenaRail({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(ARENA_RAIL_CLASS, className)}
      style={{
        paddingLeft: `${ARENA_RAIL_PADDING}px`,
        paddingRight: `${ARENA_RAIL_PADDING}px`,
        paddingBottom: "8px",
        scrollPaddingLeft: `${ARENA_RAIL_PADDING}px`,
      }}
    >
      <div
        className="flex items-start justify-start"
        style={{
          gap: `${ARENA_RAIL_GAP}px`,
          width: "max-content",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ArenaRailCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(ARENA_CARD_CLASS, className)}
      style={{
        width: `${ARENA_CARD_WIDTH}px`,
        minWidth: `${ARENA_CARD_WIDTH}px`,
        maxWidth: `${ARENA_CARD_WIDTH}px`,
        height: `${ARENA_CARD_HEIGHT}px`,
      }}
    >
      {children}
    </div>
  );
}

export function ArenaRailSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ArenaRail>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(ARENA_CARD_CLASS, "rounded-2xl bg-surface-1 animate-pulse")}
          style={{
            width: `${ARENA_CARD_WIDTH}px`,
            minWidth: `${ARENA_CARD_WIDTH}px`,
            maxWidth: `${ARENA_CARD_WIDTH}px`,
            height: `${ARENA_CARD_HEIGHT}px`,
          }}
        />
      ))}
    </ArenaRail>
  );
}