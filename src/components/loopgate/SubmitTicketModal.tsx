import { useEffect, useRef, useState } from "react";
import { ImagePlus, X, Loader2, Send, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBunny } from "@/lib/bunnyUpload";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface SubmitTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ThreadMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  sender_role: "user" | "admin";
  message: string;
  image_url: string | null;
  created_at: string;
}

interface TicketRow {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function SubmitTicketModal({ open, onOpenChange }: SubmitTicketModalProps) {
  const { user, profile } = useAuth();
  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Load latest open ticket + messages when modal opens
  useEffect(() => {
    if (!open || !user) return;
    let active = true;
    setLoading(true);
    (async () => {
      // Find latest ticket for this user (open first, then any)
      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id, subject, status, created_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!active) return;
      const latest = tickets?.[0] as TicketRow | undefined;
      if (latest) {
        setTicket(latest);
        const { data: msgs } = await supabase
          .from("support_ticket_messages")
          .select("*")
          .eq("ticket_id", latest.id)
          .order("created_at", { ascending: true });
        if (!active) return;
        setMessages((msgs || []) as ThreadMessage[]);
      } else {
        setTicket(null);
        setMessages([]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [open, user]);

  // Realtime subscription for the active ticket
  useEffect(() => {
    if (!ticket?.id) return;
    const channel = supabase
      .channel(`support_thread_${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_ticket_messages",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => {
          const m = payload.new as ThreadMessage;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages.length, loading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setUploading(true);
    try {
      const { url: cdnUrl } = await uploadToBunny(file, { folder: 'tickets' });
      setImageUrl(cdnUrl);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if (!user) {
      toast.error("Sign in to send a message");
      return;
    }
    const text = draft.trim();
    if (!text && !imageUrl) return;
    setSending(true);
    try {
      let activeTicket = ticket;
      // No ticket yet → create one using this first message
      if (!activeTicket) {
        const subject = text ? text.slice(0, 80) : "New conversation";
        const { data: created, error: tErr } = await supabase
          .from("support_tickets")
          .insert({
            user_id: user.id,
            username: (profile as any)?.username || "unknown",
            avatar_url: (profile as any)?.avatar_url || null,
            category: "other",
            subject,
            message: text || "(image)",
            image_url: imageUrl,
          })
          .select("id, subject, status, created_at")
          .single();
        if (tErr) throw tErr;
        activeTicket = created as TicketRow;
        setTicket(activeTicket);
      }

      const { error: mErr } = await supabase.from("support_ticket_messages").insert({
        ticket_id: activeTicket.id,
        user_id: user.id,
        sender_role: "user",
        message: text || "(image)",
        image_url: imageUrl,
      });
      if (mErr) throw mErr;

      setDraft("");
      setImageUrl(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[420px] p-0 gap-0 rounded-3xl border-white/10 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(36,36,38,0.96) 0%, rgba(20,20,22,0.98) 100%)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-white/[0.06]">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(180deg, #34C759 0%, #1FB84A 100%)",
              boxShadow: "0 6px 16px -4px rgba(48,209,88,0.5), 0 1px 0 rgba(255,255,255,0.3) inset",
            }}
          >
            <Sparkles className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-[15px] font-semibold text-white tracking-[-0.01em] leading-tight">
              Loopgate Support
            </DialogTitle>
            <p className="text-[11px] text-[#8E8E93] mt-0.5">
              {ticket ? `Ticket · ${ticket.status}` : "Replies in ~20 min in most cases"}
            </p>
          </div>
        </div>

        {/* Thread */}
        <div
          ref={scrollerRef}
          className="px-4 py-4 space-y-3 overflow-y-auto"
          style={{ height: 380 }}
        >
          {loading ? (
            <div className="h-full flex items-center justify-center text-[#8E8E93]">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: "rgba(118,118,128,0.18)" }}
              >
                <MessageCircle className="w-6 h-6 text-[#8E8E93]" strokeWidth={2} />
              </div>
              <p className="text-[14px] font-medium text-white">Say hi 👋</p>
              <p className="text-[12px] text-[#8E8E93] mt-1 leading-snug">
                Drop your question, bug, or feedback. We'll reply right here.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-[14px] leading-snug whitespace-pre-wrap break-words ${
                      mine
                        ? "text-white rounded-br-md"
                        : "text-white rounded-bl-md"
                    }`}
                    style={
                      mine
                        ? {
                            background: "linear-gradient(180deg, #0A84FF 0%, #0066D6 100%)",
                            boxShadow: "0 4px 12px -4px rgba(10,132,255,0.4)",
                          }
                        : {
                            background: "rgba(118,118,128,0.24)",
                            border: "0.5px solid rgba(255,255,255,0.06)",
                          }
                    }
                  >
                    {m.image_url && (
                      <img
                        src={m.image_url}
                        alt="attachment"
                        className="rounded-xl mb-1.5 max-h-[180px]"
                      />
                    )}
                    {m.message && m.message !== "(image)" ? m.message : null}
                  </div>
                  <span className="text-[10px] text-[#8E8E93] mt-1 px-1">
                    {mine ? "You" : "Support"} · {formatTime(m.created_at)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/[0.06] p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          {imageUrl && (
            <div className="relative inline-block mb-2">
              <img src={imageUrl} alt="attachment" className="max-h-[80px] rounded-lg border border-white/10" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center text-white"
              >
                <X size={10} />
              </button>
            </div>
          )}

          <div
            className="flex items-end gap-2 rounded-2xl px-2 py-1.5"
            style={{
              background: "rgba(118,118,128,0.18)",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || sending}
              className="w-8 h-8 inline-flex items-center justify-center rounded-full text-[#8E8E93] hover:text-white shrink-0"
              aria-label="Attach image"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message support…"
              rows={1}
              maxLength={2000}
              className="flex-1 bg-transparent resize-none text-[14px] text-white placeholder:text-[#8E8E93] focus:outline-none py-1.5 max-h-[120px]"
              style={{ minHeight: 28 }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || (!draft.trim() && !imageUrl)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-full text-white shrink-0 disabled:opacity-30 transition-opacity"
              style={{
                background: "linear-gradient(180deg, #0A84FF 0%, #0066D6 100%)",
                boxShadow: "0 4px 10px -3px rgba(10,132,255,0.5)",
              }}
              aria-label="Send"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
