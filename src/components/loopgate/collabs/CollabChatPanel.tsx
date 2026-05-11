import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Smile, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import GifPicker from "@/components/loopgate/GifPicker";
import { playToggleOn } from "@/lib/sounds";

interface CollabMessage {
  id: string;
  slot_id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  body: string | null;
  gif_url?: string | null;
  created_at: string;
}

export default function CollabChatPanel({
  slotId,
  open,
  onClose,
  creatorId,
  partnerId,
  inline = false,
  dock = false,
}: {
  slotId: string;
  open: boolean;
  onClose: () => void;
  creatorId: string;
  partnerId: string | null;
  inline?: boolean;
  dock?: boolean;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CollabMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gifOpen, setGifOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [unread, setUnread] = useState(0);
  const lastSeenIdRef = useRef<string | null>(null);
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
          const incoming = payload.new as CollabMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          // Notify when collapsed dock & message is from someone else
          if (incoming.user_id !== user?.id) {
            if (dock && !expanded) {
              setUnread((u) => u + 1);
              try { playToggleOn(); } catch {}
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [slotId, open, dock, expanded, user?.id]);

  // Reset unread when expanding the dock
  useEffect(() => {
    if (dock && expanded) setUnread(0);
  }, [dock, expanded]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (overrideGif?: string) => {
    if (!user) {
      toast.error("Sign in to chat");
      return;
    }
    const body = input.trim();
    if (!body && !overrideGif) return;
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
        body: overrideGif ? (body || null) : body,
        gif_url: overrideGif || null,
      } as any);
      if (error) throw error;
      setInput("");
      setGifOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Couldn't send");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  // Dock variant: fixed bar at the bottom with collapsible body + unread badge
  if (dock) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[60] pointer-events-none">
        <div className="pointer-events-auto mx-auto w-full sm:max-w-2xl bg-gradient-to-b from-[#1a0b2e] to-[#0a0418] border-t-2 sm:border-2 border-violet-500/40 sm:rounded-3xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden">
          {/* Dock header (tap to toggle) */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-black/50 border-b border-white/10"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="w-4 h-4 text-violet-300" />
                {unread > 0 && !expanded && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border border-black animate-pulse">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              <span className="text-[13px] font-black uppercase tracking-widest text-white" style={{ fontFamily: "Teko, sans-serif" }}>
                Collab Chat
              </span>
              {!expanded && messages.length > 0 && (
                <span className="hidden sm:inline text-[11px] text-white/50 truncate max-w-[260px]">
                  · {messages[messages.length - 1].gif_url ? "🎞 GIF" : messages[messages.length - 1].body}
                </span>
              )}
            </div>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronUp className="w-4 h-4 text-white/60" />
            )}
          </button>

          {/* Messages — only when expanded */}
          {expanded && (
            <div ref={scrollRef} className="h-[55vh] max-h-[480px] overflow-y-auto px-3 py-3 space-y-2 bg-black/20">
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
                      <div className={`max-w-[88%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                        {!mine && (
                          <div className="flex items-center gap-1.5 mb-0.5 px-1">
                            {m.avatar_url && <img src={m.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />}
                            <span className="text-[10px] font-bold text-white/60">@{m.username || "user"}</span>
                            {isHost && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-1 rounded">host</span>
                            )}
                          </div>
                        )}
                        <div
                          className={`${m.gif_url ? "p-1 bg-transparent" : `px-3 py-2 ${
                            mine
                              ? "bg-gradient-to-b from-violet-500 to-violet-700 text-white rounded-br-md shadow-[0_2px_0_rgba(0,0,0,0.4)]"
                              : "bg-white/[0.08] text-white border border-white/10 rounded-bl-md"
                          }`} rounded-2xl text-[13px] leading-snug break-words`}
                        >
                          {m.gif_url ? (
                            <img src={m.gif_url} alt="gif" className="max-w-[220px] w-full rounded-xl border border-white/10" loading="lazy" />
                          ) : (
                            m.body
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Composer — always visible */}
          <div className="relative p-2.5 border-t border-white/10 bg-black/50 pb-[calc(env(safe-area-inset-bottom)+8px)]">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setGifOpen((v) => !v); setExpanded(true); }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 active:translate-y-[1px] shadow-[0_3px_0_rgba(0,0,0,0.5)] ${
                    gifOpen ? "bg-violet-500 text-white" : "bg-white/[0.06] border border-white/10 text-white/80"
                  }`}
                  title="GIFs & Stickers"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onFocus={() => setExpanded(true)}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Cook together — say something…"
                  maxLength={500}
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/60"
                />
                <button
                  onClick={() => send()}
                  disabled={sending || !input.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-b from-violet-500 to-violet-700 flex items-center justify-center disabled:opacity-40 active:translate-y-[2px] shadow-[0_3px_0_rgba(0,0,0,0.5)]"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            ) : (
              <p className="text-center text-[12px] text-white/50 py-1.5">Sign in to join the chat</p>
            )}

            {gifOpen && user && (
              <div className="absolute inset-x-0 bottom-full max-h-[60vh] border-t-2 border-violet-500/40 rounded-t-2xl overflow-hidden bg-[#0a0418]">
                <GifPicker onSelect={(url) => send(url)} onClose={() => setGifOpen(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const body = (
    <div
      className={
        inline
          ? "relative w-full h-[78vh] min-h-[560px] bg-gradient-to-b from-[#1a0b2e] to-[#0a0418] border-2 border-violet-500/30 rounded-3xl shadow-[0_6px_0_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          : "relative w-full sm:max-w-xl h-[85vh] sm:h-[75vh] bg-gradient-to-b from-[#1a0b2e] to-[#0a0418] border-t-2 sm:border-2 border-violet-500/30 rounded-t-3xl sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
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
                <div className={`max-w-[88%] sm:max-w-[82%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
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
                    className={`${m.gif_url ? "p-1 bg-transparent" : `px-3 py-2 ${
                      mine
                        ? "bg-gradient-to-b from-violet-500 to-violet-700 text-white rounded-br-md shadow-[0_2px_0_rgba(0,0,0,0.4)]"
                        : "bg-white/[0.08] text-white border border-white/10 rounded-bl-md"
                    }`} rounded-2xl text-[13px] leading-snug break-words`}
                  >
                    {m.gif_url ? (
                      <img
                        src={m.gif_url}
                        alt="gif"
                        className="max-w-[220px] w-full rounded-xl border border-white/10"
                        loading="lazy"
                      />
                    ) : (
                      m.body
                    )}
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
            <button
              onClick={() => setGifOpen((v) => !v)}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:translate-y-[1px] shadow-[0_3px_0_rgba(0,0,0,0.5)] ${
                gifOpen
                  ? "bg-violet-500 text-white"
                  : "bg-white/[0.06] border border-white/10 text-white/80"
              }`}
              title="GIFs & Stickers"
            >
              <Smile className="w-5 h-5" />
            </button>
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
              onClick={() => send()}
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

      {/* GIF picker overlay */}
      {gifOpen && user && (
        <div className="absolute inset-x-0 bottom-0 z-10 max-h-[70%] border-t-2 border-violet-500/40 rounded-t-2xl overflow-hidden">
          <GifPicker
            onSelect={(url) => send(url)}
            onClose={() => setGifOpen(false)}
          />
        </div>
      )}
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