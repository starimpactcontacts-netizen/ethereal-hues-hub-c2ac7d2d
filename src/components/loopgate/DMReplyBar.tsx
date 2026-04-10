import { X, Reply } from "lucide-react";

interface DMReplyBarProps {
  username: string;
  text: string;
  isMe: boolean;
  onClear: () => void;
}

export default function DMReplyBar({ username, text, isMe, onClear }: DMReplyBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 mx-2 mt-1 rounded-lg bg-muted/50 border-l-2 border-primary/50">
      <Reply className="w-3.5 h-3.5 shrink-0 text-primary/70 rotate-180" />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-primary/80">
          {isMe ? 'You' : username}
        </span>
        <p className="text-[11px] text-muted-foreground truncate">{text}</p>
      </div>
      <button
        onClick={onClear}
        className="shrink-0 p-1 rounded-full hover:bg-muted active:bg-muted/80 touch-manipulation"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
