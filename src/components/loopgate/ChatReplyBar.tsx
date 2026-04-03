import { X, Reply } from "lucide-react";

interface ChatReplyBarProps {
  username: string;
  text: string;
  onClear: () => void;
  accentColor?: string;
}

export default function ChatReplyBar({ username, text, onClear, accentColor = "red" }: ChatReplyBarProps) {
  const colors: Record<string, string> = {
    red: "border-red-500/40 bg-red-500/10 text-red-400",
    purple: "border-purple-500/40 bg-purple-500/10 text-purple-400",
    gold: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  };
  const cls = colors[accentColor] || colors.red;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border-l-2 ${cls} mx-2 mt-1.5 rounded-r-sm`}>
      <Reply className="w-3 h-3 shrink-0 rotate-180" />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-black uppercase tracking-wider">@{username}</span>
        <p className="text-[10px] text-foreground/50 truncate">{text}</p>
      </div>
      <button onClick={onClear} className="shrink-0 text-foreground/30 hover:text-foreground transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
