import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CollabMessage {
  id: string;
  slot_id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  body: string;
  created_at: string;
}

export default function CollabChatPanel({
  slotId,
  open,
  onClose,
  creatorId,
  partnerId,
  inline = false,
}: {
  slotId: string;
  open: boolean;
  onClose: () => void;
  creatorId: string;
  partnerId: string | null;
  inline?: boolean;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("collab_messages")
        .select("*")
        .eq("slot_id", slotId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (mounted) {
        setMessages((data as CollabMessage[]) || []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`collab-chat-${slotId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "collab_messages", filter: `slot_id=eq.${slotId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as any).id)) return prev;
            return [...prev, payload.new as CollabMessage];
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [slotId, open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    if (!user) {
      toast.error("Sign in to chat");
      return;
    }
    const body = input.trim();
    if (!body) return;
    setSending(true);
    try {
      const username =
        (user.user_metadata as any)?.username ||
        (user.user_metadata as any)?.full_name ||
        user.email?.split("@")[0] ||
        "user";
      const avatar_url = (user.user_metadata as any)?.avatar_url || null;
      const { error } = await supabase.from("collab_messages").insert({
        slot_id: slotId,
        user_id: user.id,
        username,
        avatar_url,
        body,
      });
      if (error) throw error;
      setInput("");
    } catch (e: any) {
      toast.error(e.message || "Couldn't send");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const body = (
    <div
      className={
        inline
          ? "relative w-full h-[60vh] bg-gradient-to-b from-[#1a0b2e] to-[#0a0418] border-2 border-violet-500/30 rounded-3xl shadow-[0_6px_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          : "relative w-full sm:max-w-md h-[80vh] sm:h-[70vh] bg-gradient-to-b from-[#1a0b2e] to-[#0a0418] border-t-2 sm:border-2 border-violet-500/30 rounded-t-3xl sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
        <p className="text-[14px] font-black uppercase tracking-widest text-white" style={{ fontFamily: "Teko, sans-serif" }}>
          Collab Chat
        </p>
        {!inline && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-white/40 text-[12px] py-12">No messages yet — say hi 👋</p>
        ) : (
          messages.map((m) => {
            const mine = user?.id === m.user_id;
            const isHost = m.user_id === creatorId || m.user_id === partnerId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && (
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : null}
                      <span className="text-[10px] font-bold text-white/60">@{m.username || "user"}</span>
                      {isHost && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-1 rounded">
                          host
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-[13px] leading-snug break-words ${
                      mine
                        ? "bg-gradient-to-b from-violet-500 to-violet-700 text-white rounded-br-md shadow-[0_2px_0_rgba(0,0,0,0.4)]"
                        : "bg-white/[0.08] text-white border border-white/10 rounded-bl-md"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className={`p-3 border-t border-white/10 bg-black/40 ${inline ? "" : "pb-[calc(env(safe-area-inset-bottom)+12px)]"}`}>
        {user ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Say something…"
              maxLength={500}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/60"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="w-11 h-11 rounded-full bg-gradient-to-b from-violet-500 to-violet-700 flex items-center justify-center disabled:opacity-40 active:translate-y-[2px] shadow-[0_3px_0_rgba(0,0,0,0.5)]"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        ) : (
          <p className="text-center text-[12px] text-white/50">Sign in to join the chat</p>
        )}
      </div>
    </div>
  );

  if (inline) return body;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {body}
    </div>
  );
}