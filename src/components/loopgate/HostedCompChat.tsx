import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  created_at: string;
}

interface HostedCompChatProps {
  competitionId: string;
  competitionName: string;
}

export default function HostedCompChat({ competitionId, competitionName }: HostedCompChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!competitionId || !isExpanded) return;

    setLoading(true);
    const fetchMessages = async () => {
      // Use raw query since types may not be regenerated yet
      const { data } = await supabase
        .from('hosted_comp_messages' as any)
        .select('*')
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: true })
        .limit(100);

      setMessages((data as unknown as Message[]) || []);
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to realtime
    const channel = supabase
      .channel(`hosted-comp-chat-${competitionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hosted_comp_messages',
        filter: `competition_id=eq.${competitionId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId, isExpanded]);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile) return;

    setIsSending(true);
    const { error } = await supabase
      .from('hosted_comp_messages' as any)
      .insert({
        competition_id: competitionId,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        message_text: newMessage.trim()
      });

    if (!error) {
      setNewMessage("");
    }
    setIsSending(false);
  };

  return (
    <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-surface-2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold">Competition Chat</span>
          {messages.length > 0 && !isExpanded && (
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Chat Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Messages */}
            <div className="h-48 overflow-y-auto border-t border-border p-3 space-y-2 bg-background">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-2 overflow-hidden flex-shrink-0">
                      {msg.avatar_url ? (
                        <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          {msg.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-cyan-400">{msg.username}</span>
                        <span className="text-[9px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground break-words">{msg.message_text}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {user ? (
              <form onSubmit={handleSend} className="border-t border-border p-2 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="px-3 py-2 bg-cyan-500 text-background rounded-lg disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            ) : (
              <div className="border-t border-border p-3 text-center">
                <p className="text-xs text-muted-foreground">Sign in to chat</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
