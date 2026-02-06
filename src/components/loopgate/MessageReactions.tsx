import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface MessageReactionsProps {
  messageId: string;
  messageTable: "crew_channel_messages" | "direct_messages" | "crew_messages";
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface ReactionRow {
  emoji: string;
  user_id: string;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "💀", "👀"];

export default function MessageReactions({ messageId, messageTable }: MessageReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch reactions for this message
  useEffect(() => {
    const fetchReactions = async () => {
      const { data, error } = await supabase
        .from("crew_message_reactions" as any)
        .select("emoji, user_id")
        .eq("message_id", messageId);

      if (!error && data) {
        const rows = data as unknown as ReactionRow[];
        const grouped: Record<string, Reaction> = {};
        rows.forEach((r) => {
          if (!grouped[r.emoji]) {
            grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasReacted: false };
          }
          grouped[r.emoji].count++;
          grouped[r.emoji].users.push(r.user_id);
          if (r.user_id === user?.id) {
            grouped[r.emoji].hasReacted = true;
          }
        });
        setReactions(grouped);
      }
    };

    fetchReactions();
  }, [messageId, user?.id]);

  const handleReact = async (emoji: string) => {
    if (!user || loading) return;
    setLoading(true);

    const existingReaction = reactions[emoji];
    const hasReacted = existingReaction?.hasReacted;

    if (hasReacted) {
      // Remove reaction
      await supabase
        .from("crew_message_reactions" as any)
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji);

      setReactions((prev) => {
        const updated = { ...prev };
        if (updated[emoji]) {
          updated[emoji] = {
            ...updated[emoji],
            count: updated[emoji].count - 1,
            users: updated[emoji].users.filter((u) => u !== user.id),
            hasReacted: false,
          };
          if (updated[emoji].count === 0) {
            delete updated[emoji];
          }
        }
        return updated;
      });
    } else {
      // Add reaction
      await supabase.from("crew_message_reactions" as any).insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });

      setReactions((prev) => ({
        ...prev,
        [emoji]: {
          emoji,
          count: (prev[emoji]?.count || 0) + 1,
          users: [...(prev[emoji]?.users || []), user.id],
          hasReacted: true,
        },
      }));
    }

    setLoading(false);
    setShowPicker(false);
  };

  const reactionArray = Object.values(reactions);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {/* Existing reactions */}
      {reactionArray.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReact(reaction.emoji)}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border transition-colors",
            reaction.hasReacted
              ? "bg-primary/20 border-primary/40 text-foreground"
              : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50"
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="text-[10px] font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <button
            className="opacity-0 group-hover/msg:opacity-100 p-1 rounded hover:bg-muted/50 transition-opacity"
          >
            <Smile className="w-3.5 h-3.5 text-muted-foreground/60" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          side="top" 
          align="start" 
          className="w-auto p-2 bg-card border-border/60"
        >
          <div className="flex gap-1">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted/50 text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
