import { useState, useEffect, useCallback } from "react";
import { TicketCheck, Bug, Lightbulb, MessageSquare, Clock, CheckCircle2, ChevronDown, MessageCircleReply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Ticket {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  category: string;
  subject: string;
  message: string;
  image_url: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/20 text-red-400",
  in_progress: "bg-gold/20 text-gold",
  resolved: "bg-emerald-500/20 text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

const CAT_ICONS: Record<string, typeof Bug> = {
  bug: Bug,
  suggestion: Lightbulb,
  other: MessageSquare,
};

export default function SupportTicketsAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [filter, setFilter] = useState<string>("open");
  const [showAll, setShowAll] = useState(false);

  const fetchTickets = useCallback(async () => {
    let query = supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setTickets((data as Ticket[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Marked as ${status}`);
    fetchTickets();
  };

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    const { error } = await supabase
      .from("support_tickets")
      .update({
        admin_reply: replyText.trim(),
        replied_at: new Date().toISOString(),
        status: "resolved",
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    if (error) { toast.error("Failed to reply"); }
    else { toast.success("Reply sent"); setReplyText(""); setExpandedId(null); }
    setReplying(false);
    fetchTickets();
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded" />)}
        </div>
      </div>
    );
  }

  const displayTickets = showAll ? tickets : tickets.slice(0, 15);
  const openCount = tickets.filter(t => t.status === "open").length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <TicketCheck size={14} className="text-primary" />
          Support Tickets
          {openCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">
              {openCount} open
            </span>
          )}
        </h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3">
        {["open", "in_progress", "resolved", "all"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setShowAll(false); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              filter === f ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-muted/30"
            }`}
          >
            {f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-8 text-xs text-muted-foreground">No tickets</div>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {displayTickets.map((ticket) => {
            const CatIcon = CAT_ICONS[ticket.category] || MessageSquare;
            const expanded = expandedId === ticket.id;

            return (
              <div key={ticket.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : ticket.id)}
                  className="w-full p-3 flex items-start gap-2.5 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-muted/50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {ticket.avatar_url ? (
                      <img src={ticket.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {ticket.username?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CatIcon size={10} className={ticket.category === "bug" ? "text-red-400" : "text-gold"} />
                      <span className="text-xs font-semibold truncate">{ticket.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-muted-foreground">@{ticket.username}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <ChevronDown size={12} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>

                {expanded && (
                  <div className="px-3 pb-3 border-t border-border/30 pt-2 space-y-2">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{ticket.message}</p>

                    {ticket.image_url && (
                      <a href={ticket.image_url} target="_blank" rel="noopener noreferrer">
                        <img src={ticket.image_url} alt="attachment" className="max-h-[200px] rounded-lg border border-border/30" />
                      </a>
                    )}

                    {ticket.admin_reply && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
                        <p className="text-[9px] font-bold text-primary uppercase mb-1">Admin Reply</p>
                        <p className="text-xs text-foreground">{ticket.admin_reply}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {ticket.status === "open" && (
                        <button
                          onClick={() => updateStatus(ticket.id, "in_progress")}
                          className="px-2.5 py-1 rounded-lg bg-gold/20 text-gold text-[10px] font-bold hover:bg-gold/30"
                        >
                          <Clock size={10} className="inline mr-1" />
                          Working on it
                        </button>
                      )}
                      {ticket.status !== "resolved" && (
                        <button
                          onClick={() => updateStatus(ticket.id, "resolved")}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30"
                        >
                          <CheckCircle2 size={10} className="inline mr-1" />
                          Resolve
                        </button>
                      )}
                    </div>

                    {/* Quick reply */}
                    {!ticket.admin_reply && (
                      <div className="flex gap-2 pt-1">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="reply to user..."
                          className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-primary/50"
                        />
                        <button
                          onClick={() => sendReply(ticket.id)}
                          disabled={replying || !replyText.trim()}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold disabled:opacity-40"
                        >
                          <MessageCircleReply size={10} className="inline mr-1" />
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tickets.length > 15 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
        >
          <ChevronDown size={12} />
          Show all {tickets.length} tickets
        </button>
      )}
    </section>
  );
}
