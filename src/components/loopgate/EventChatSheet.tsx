import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Smile, Image as ImageIcon, Reply, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import ChatBubble from "./ChatBubble";

interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message_text: string | null;
  message_type: "text" | "gif" | "sticker";
  media_url: string | null;
  reply_to_id: string | null;
  reply_to_username: string | null;
  reply_to_text: string | null;
  created_at: string;
}

// Hardcoded reaction sticker pack (huge emoji rendered as stickers)
const STICKER_PACK = ["🔥", "💯", "👑", "😂", "💀", "🤯", "🥶", "👀", "🚀", "⚡", "🏆", "💎"];

// Curated public Giphy CDN reaction GIFs (hot edit-culture)
const GIF_PACK = [
  { id: "g1", url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif", label: "Fire" },
  { id: "g2", url: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif", label: "Mind blown" },
  { id: "g3", url: "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif", label: "OK" },
  { id: "g4", url: "https://media.giphy.com/media/26gswCTKOY1L4FSU0/giphy.gif", label: "Crying" },
  { id: "g5", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif", label: "Clap" },
  { id: "g6", url: "https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/giphy.gif", label: "Goat" },
  { id: "g7", url: "https://media.giphy.com/media/3o7TKvhWqg0nq2Vnxu/giphy.gif", label: "Cold" },
  { id: "g8", url: "https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif", label: "Salute" },
];

interface EventChatSheetProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

export default function EventChatSheet({ open, onClose, eventId, eventTitle }: EventChatSheetProps) {
  const { user, profile, isAdmin, isDev } = useAuth();
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [picker, setPicker] = useState<"none" | "sticker" | "gif">("none");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canModerate = isAdmin || isDev;

  // Fetch + subscribe
  useEffect(() => {
    if (!open || !eventId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled && !error) setMessages((data || []) as EventMessage[]);
    })();

    const ch = supabase
      .channel(`event-chat-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "event_messages", filter: `event_id=eq.${eventId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as EventMessage]),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "event_messages" },
        (payload) => {
          const id = (payload.old as any)?.id;
          if (id) setMessages((prev) => prev.filter((m) => m.id !== id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [open, eventId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Mark read on open & whenever new message arrives
  useEffect(() => {
    if (!open || !user || !eventId) return;
    supabase
      .from("event_chat_reads")
      .upsert({ user_id: user.id, event_id: eventId, last_read_at: new Date().toISOString() })
      .then(() => {});
  }, [open, user, eventId, messages.length]);

  const send = async (payload: Partial<EventMessage>) => {
    if (!user || !profile) {
      toast.error("Sign in to chat");
      return;
    }
    setSending(true);
    const insert: any = {
      event_id: eventId,
      user_id: user.id,
      username: (profile as any).display_name || profile.username || "Anonymous",
      avatar_url: profile.avatar_url,
      message_type: payload.message_type || "text",
      message_text: payload.message_text || null,
      media_url: payload.media_url || null,
    };
    if (replyTo) {
      insert.reply_to_id = replyTo.id;
      insert.reply_to_username = replyTo.username;
      insert.reply_to_text = replyTo.text;
    }
    const { error } = await supabase.from("event_messages").insert(insert);
    setSending(false);
    if (error) {
      toast.error("Failed to send");
    } else {
      setText("");
      setReplyTo(null);
      setPicker("none");
    }
  };

  const handleText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    send({ message_type: "text", message_text: text.trim() });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("event_messages").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else setMessages((p) => p.filter((m) => m.id !== id));
  };

  const formatTime = (s: string) => format(new Date(s), "HH:mm");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 inset-x-0 z-[61] h-[88vh] rounded-t-2xl bg-arena-bg border-t border-arena-line/40 shadow-[0_-30px_60px_rgba(0,0,0,0.6)] flex flex-col"
          >
            {/* Handle */}
            <div className="pt-2 pb-1 flex items-center justify-center">
              <div className="w-10 h-1 rounded-full bg-arena-line/60" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 flex items-center justify-between border-b border-arena-line/30">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-arena-muted">Live Chat</p>
                <h3 className="text-[16px] font-black uppercase text-arena-ink truncate">{eventTitle}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-arena-strong text-arena-ink"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="text-4xl mb-2">🔥</div>
                  <p className="text-arena-ink font-black uppercase tracking-wider text-sm">Be the first to type</p>
                  <p className="text-arena-muted text-xs mt-1">Trash talk. Drop reactions. Hype the goats.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const own = m.user_id === user?.id;
                  return (
                    <div key={m.id} className={`flex gap-2 group ${own ? "flex-row-reverse" : ""}`}>
                      <div className="w-8 h-8 shrink-0 rounded-full bg-arena-strong overflow-hidden flex items-center justify-center text-[10px] font-black uppercase text-arena-ink">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          m.username?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <div className={`max-w-[75%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`flex items-baseline gap-2 mb-0.5 ${own ? "flex-row-reverse" : ""}`}>
                          <span className="text-[11px] font-bold text-arena-ink">{m.username}</span>
                          <span className="text-[9px] text-arena-muted">{formatTime(m.created_at)}</span>
                        </div>
                        {m.reply_to_username && (
                          <div className={`flex items-center gap-1 text-[9px] text-arena-muted/70 mb-0.5 ${own ? "justify-end" : ""}`}>
                            <Reply size={10} className="rotate-180" />
                            <span>↳ @{m.reply_to_username}: <span className="italic">{m.reply_to_text}</span></span>
                          </div>
                        )}
                        {m.message_type === "sticker" ? (
                          <div className={`text-[56px] leading-none ${own ? "text-right" : ""}`}>{m.message_text}</div>
                        ) : m.message_type === "gif" ? (
                          <img
                            src={m.media_url || ""}
                            alt="gif"
                            className="rounded-lg max-w-[180px] max-h-[180px] object-cover shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
                          />
                        ) : (
                          <ChatBubble userId={m.user_id}>
                            <div
                              className={`inline-block px-3 py-2 rounded-2xl text-[13px] break-words whitespace-pre-wrap ${
                                own
                                  ? "bg-arena-emerald text-primary rounded-br-sm font-semibold"
                                  : "bg-arena-strong text-arena-ink rounded-bl-sm"
                              }`}
                            >
                              {m.message_text}
                            </div>
                          </ChatBubble>
                        )}
                        <div className={`flex gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition ${own ? "justify-end" : ""}`}>
                          <button
                            onClick={() => {
                              setReplyTo({
                                id: m.id,
                                username: m.username,
                                text: (m.message_text || (m.message_type === "gif" ? "GIF" : "")).slice(0, 60),
                              });
                              inputRef.current?.focus();
                            }}
                            className="p-1 text-arena-muted hover:text-arena-ink"
                            aria-label="Reply"
                          >
                            <Reply size={11} className="rotate-180" />
                          </button>
                          {(canModerate || own) && (
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-1 text-arena-muted hover:text-red-400"
                              aria-label="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {/* Sticker / GIF picker */}
            {picker !== "none" && (
              <div className="border-t border-arena-line/30 p-3 bg-arena-panel max-h-[200px] overflow-y-auto">
                {picker === "sticker" ? (
                  <div className="grid grid-cols-6 gap-2">
                    {STICKER_PACK.map((s) => (
                      <button
                        key={s}
                        onClick={() => send({ message_type: "sticker", message_text: s })}
                        className="aspect-square rounded-lg bg-arena-strong text-[28px] active:scale-90 transition flex items-center justify-center"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {GIF_PACK.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => send({ message_type: "gif", media_url: g.url })}
                        className="aspect-square rounded-lg overflow-hidden bg-arena-strong active:scale-95 transition relative"
                      >
                        <img src={g.url} alt={g.label} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reply bar */}
            {replyTo && (
              <div className="px-3 pt-2 bg-arena-panel border-t border-arena-line/30 flex items-center justify-between gap-2">
                <div className="text-[10px] text-arena-muted truncate">
                  Replying to <span className="text-arena-ink font-bold">@{replyTo.username}</span>: {replyTo.text}
                </div>
                <button onClick={() => setReplyTo(null)} className="text-arena-muted hover:text-arena-ink">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleText}
              className="border-t border-arena-line/30 bg-arena-bg p-3 pb-[max(env(safe-area-inset-bottom,0px),12px)] flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => setPicker(picker === "sticker" ? "none" : "sticker")}
                className={`p-2 rounded-lg transition ${
                  picker === "sticker" ? "bg-arena-emerald text-primary" : "bg-arena-strong text-arena-ink"
                }`}
                aria-label="Stickers"
              >
                <Smile size={18} />
              </button>
              <button
                type="button"
                onClick={() => setPicker(picker === "gif" ? "none" : "gif")}
                className={`p-2 rounded-lg transition ${
                  picker === "gif" ? "bg-arena-emerald text-primary" : "bg-arena-strong text-arena-ink"
                }`}
                aria-label="GIFs"
              >
                <ImageIcon size={18} />
              </button>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Drop a message..."
                maxLength={500}
                disabled={sending}
                className="flex-1 bg-arena-strong text-arena-ink placeholder:text-arena-muted/60 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-arena-emerald"
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="p-2.5 rounded-lg bg-arena-emerald text-primary disabled:opacity-40 active:scale-95 transition"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}