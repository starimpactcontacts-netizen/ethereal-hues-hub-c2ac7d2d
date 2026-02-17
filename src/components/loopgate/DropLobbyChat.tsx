import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string;
  is_system: boolean;
  created_at: string;
}

interface DropLobbyChatProps {
  dropId: string;
  accentColor?: string;
}

export default function DropLobbyChat({ dropId, accentColor = 'purple' }: DropLobbyChatProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('featured_drop_messages' as any)
        .select('*')
        .eq('drop_id', dropId)
        .order('created_at', { ascending: true })
        .limit(100);

      setMessages((data as unknown as Message[]) || []);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`drop-chat-${dropId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'featured_drop_messages',
        filter: `drop_id=eq.${dropId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dropId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile) return;

    setIsSending(true);
    await supabase
      .from('featured_drop_messages' as any)
      .insert({
        drop_id: dropId,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        message_text: newMessage.trim()
      });

    setNewMessage("");
    setIsSending(false);
  };

  return (
    <div className="bg-surface-0 border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2 bg-surface-1">
        <MessageCircle className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Live Chat</span>
        {messages.length > 0 && (
          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold rounded-full">
            {messages.length}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="h-52 overflow-y-auto p-2 space-y-1.5 bg-background">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground">Be the first to say something</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-1.5 ${msg.is_system ? 'justify-center' : ''}`}
              >
                {msg.is_system ? (
                  <p className="text-[10px] text-muted-foreground italic">{msg.message_text}</p>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-surface-2 overflow-hidden shrink-0 mt-0.5">
                      {msg.avatar_url ? (
                        <img src={msg.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          {msg.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-purple-400 mr-1.5">{msg.username}</span>
                      <span className="text-[11px] text-foreground break-words">{msg.message_text}</span>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {user ? (
        <form onSubmit={handleSend} className="border-t border-border p-1.5 flex gap-1.5 bg-surface-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
            maxLength={300}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="px-2.5 py-1.5 bg-purple-500 text-white rounded-md disabled:opacity-40 transition-opacity"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      ) : (
        <div className="border-t border-border p-2 text-center">
          <button onClick={() => navigate('/start')} className="text-[10px] text-purple-400 font-medium hover:underline">
            Sign in to chat
          </button>
        </div>
      )}
    </div>
  );
}
