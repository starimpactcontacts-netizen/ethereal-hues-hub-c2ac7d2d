import { useState, useEffect } from "react";
import { Pin, X, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import RichMessageContent from "./RichMessageContent";
import { useNavigate } from "react-router-dom";

interface PinnedMessage {
  id: string;
  channel_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  message_text: string;
  created_at: string;
}

interface PinnedMessagesPanelProps {
  channelId: string;
  channelName: string;
  isOpen: boolean;
  onClose: () => void;
  isOfficer?: boolean;
  onUnpin?: (messageId: string) => void;
}

export default function PinnedMessagesPanel({
  channelId,
  channelName,
  isOpen,
  onClose,
  isOfficer = false,
  onUnpin,
}: PinnedMessagesPanelProps) {
  const navigate = useNavigate();
  const [pinned, setPinned] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !channelId) return;

    const fetchPinned = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("crew_channel_messages")
        .select("*")
        .eq("channel_id", channelId)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPinned(data as PinnedMessage[]);
      }
      setLoading(false);
    };

    fetchPinned();
  }, [isOpen, channelId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-y-0 right-0 w-full max-w-sm bg-surface-1 border-l border-border z-40 flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-gold" />
              <span className="font-semibold text-sm">Pinned Messages</span>
              <span className="text-xs text-muted-foreground">#{channelName}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pinned.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Pin className="w-10 h-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No Pinned Messages</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Officers can pin important messages for everyone to see
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {pinned.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-background border border-border/50 rounded-lg p-3 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar
                        className="w-8 h-8 shrink-0 cursor-pointer"
                        onClick={() => navigate(`/u/${msg.username}`)}
                      >
                        <AvatarImage src={msg.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {(msg.display_name || msg.username || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold">{msg.display_name || msg.username}</span>
                          <span className="text-[10px] text-muted-foreground/50">
                            {format(new Date(msg.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <div className="text-sm text-foreground/80 mt-0.5 break-words">
                          <RichMessageContent content={msg.message_text} />
                        </div>
                      </div>
                      {isOfficer && onUnpin && (
                        <button
                          onClick={() => onUnpin(msg.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
                          title="Unpin message"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
