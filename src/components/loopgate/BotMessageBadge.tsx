import { Check, ShieldCheck } from "lucide-react";

interface BotMessageBadgeProps {
  size?: "sm" | "md";
}

export default function BotMessageBadge({ size = "sm" }: BotMessageBadgeProps) {
  const isSmall = size === "sm";

  return (
    <span className={`inline-flex items-center gap-0.5 ${isSmall ? "px-1 py-[1px]" : "px-1.5 py-0.5"} rounded bg-primary/15 border border-primary/20`}>
      <ShieldCheck className={`${isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} text-primary`} />
      <span className={`${isSmall ? "text-[9px]" : "text-[10px]"} font-bold text-primary uppercase tracking-wider`}>
        APP
      </span>
    </span>
  );
}
