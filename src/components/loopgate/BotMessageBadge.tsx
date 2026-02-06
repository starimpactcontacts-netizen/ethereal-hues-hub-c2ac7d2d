import { Bot, Check } from "lucide-react";

interface BotMessageBadgeProps {
  size?: "sm" | "md";
}

export default function BotMessageBadge({ size = "sm" }: BotMessageBadgeProps) {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const checkSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      <span className="relative inline-flex items-center justify-center">
        <Bot className={`${iconSize} text-primary`} />
        <span className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-[1px]">
          <Check className={`${checkSize} text-primary-foreground`} strokeWidth={3} />
        </span>
      </span>
      <span className="text-[10px] font-bold text-primary uppercase tracking-wider ml-0.5">BOT</span>
    </span>
  );
}
