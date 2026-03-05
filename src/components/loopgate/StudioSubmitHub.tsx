import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Trophy, Loader2, X, DollarSign,
  Swords, Flame, Music, Target, Users, Zap,
  ChevronRight, Inbox, ArrowRight, LogIn
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSoloMode } from "@/hooks/useSoloMode";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

type SubmittableItem = {
  id: string;
  type: "solo" | "battle" | "drop" | "hosted_comp" | "event";
  label: string;
  subLabel: string;
  icon: typeof Swords;
  color: string;
  deadline?: string;
  alreadySubmitted?: boolean;
  soloId?: string;
};

export default function StudioSubmitHub() {
  const { user, profile } = useAuth();
  const { activeSolo, submitEdit: submitSolo } = useSoloMode();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<SubmittableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SubmittableItem | null>(null);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [submitting, setSubmitting] = useState(false);

  const fetchArenaItems = useCallback(async () => {
    if (!user) {
      // Guest mode: fetch public drops/events only
      const allItems: SubmittableItem[] = [];
      const { data: drops } = await supabase
        .from("featured_drops")
        .select("id, title, song_name, status, ends_at")
        .in("status", ["active", "submissions_open"])
        .order("created_at", { ascending: false })
        .limit(5);
      if (drops) {
        for (const d of drops) {
          allItems.push({
            id: d.id, type: "drop", label: d.title,
            subLabel: d.song_name, icon: Music, color: "#8B5CF6",
            deadline: d.ends_at || undefined,
          });
        }
      }
      const { data: events } = await supabase
        .from("events")
        .select("id, title, end_date, status")
        .in("status", ["active", "submissions_open"])
        .order("start_date", { ascending: false })
        .limit(5);
      if (events) {
        for (const e of events) {
          allItems.push({
            id: e.id, type: "event", label: e.title,
            subLabel: "Official Event", icon: Target, color: "#F59E0B",
            deadline: e.end_date || undefined,
          });
        }
      }
      setItems(allItems);
      setLoading(false);
      return;
    }

    const allItems: SubmittableItem[] = [];

    // 1. Active Solo
    if (activeSolo && (activeSolo.status === "editing" || activeSolo.status === "picking_song")) {
      allItems.push({
        id: activeSolo.id, type: "solo",
        label: `Solo — ${activeSolo.theme}`, subLabel: activeSolo.song_name,
        icon: Flame, color: "#FF6B35", soloId: activeSolo.id,
      });
    }

    // 2. Active Battles
    const { data: battles } = await supabase
      .from("battles")
      .select("id, challenger_id, opponent_id, challenger_username, opponent_username, theme_song_name, status, ends_at, challenger_submission_url, opponent_submission_url")
      .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .in("status", ["accepted", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(10);
    if (battles) {
      for (const b of battles) {
        const isChallenger = b.challenger_id === user.id;
        allItems.push({
          id: b.id, type: "battle",
          label: `1v1 vs ${isChallenger ? (b.opponent_username || "Opponent") : (b.challenger_username || "Challenger")}`,
          subLabel: b.theme_song_name || "Battle", icon: Swords, color: "#EF4444",
          deadline: b.ends_at || undefined,
          alreadySubmitted: isChallenger ? !!b.challenger_submission_url : !!b.opponent_submission_url,
        });
      }
    }

    // 3. Active Featured Drops
    const { data: drops } = await supabase
      .from("featured_drops")
      .select("id, title, song_name, status, ends_at, mission_live")
      .or("status.in.(active,submissions_open),mission_live.eq.true")
      .order("created_at", { ascending: false })
      .limit(10);
    if (drops) {
      const dropIds = drops.map(d => d.id);
      const { data: existingSubs } = await supabase
        .from("featured_submissions").select("drop_id")
        .eq("user_id", user.id).in("drop_id", dropIds);
      const submittedDropIds = new Set((existingSubs || []).map(s => (s as any).drop_id));
      for (const d of drops as any[]) {
        allItems.push({
          id: d.id, type: "drop", label: d.mission_live ? `💰 ${d.title}` : d.title,
          subLabel: d.song_name, icon: d.mission_live ? DollarSign : Music, color: d.mission_live ? "#10B981" : "#8B5CF6",
          deadline: d.ends_at || undefined, alreadySubmitted: submittedDropIds.has(d.id),
        });
      }
    }

    // 4. Hosted Competitions user joined
    const { data: joinedComps } = await supabase
      .from("hosted_competition_participants" as any)
      .select("competition_id").eq("user_id", user.id);
    if (joinedComps && joinedComps.length > 0) {
      const compIds = joinedComps.map((j: any) => j.competition_id);
      const { data: comps } = await supabase
        .from("hosted_competitions" as any)
        .select("id, name, submission_deadline, status")
        .in("id", compIds).in("status", ["open", "active", "submissions_open"]);
      if (comps) {
        const { data: compSubs } = await supabase
          .from("hosted_competition_submissions" as any)
          .select("competition_id").eq("user_id", user.id).in("competition_id", compIds);
        const submittedCompIds = new Set((compSubs || []).map((s: any) => s.competition_id));
        for (const c of comps as any[]) {
          allItems.push({
            id: c.id, type: "hosted_comp", label: c.name,
            subLabel: "Community Comp", icon: Users, color: "#06B6D4",
            deadline: c.submission_deadline || undefined, alreadySubmitted: submittedCompIds.has(c.id),
          });
        }
      }
    }

    // 5. Active Events
    const { data: events } = await supabase
      .from("events").select("id, title, end_date, status")
      .in("status", ["active", "submissions_open"])
      .order("start_date", { ascending: false }).limit(10);
    if (events) {
      const eventIds = events.map(e => e.id);
      const { data: eventSubs } = await supabase
        .from("event_participations").select("event_id")
        .eq("user_id", user.id).in("event_id", eventIds);
      const submittedEventIds = new Set((eventSubs || []).map(s => s.event_id));
      for (const e of events) {
        allItems.push({
          id: e.id, type: "event", label: e.title,
          subLabel: "Official Event", icon: Target, color: "#F59E0B",
          deadline: e.end_date || undefined, alreadySubmitted: submittedEventIds.has(e.id),
        });
      }
    }

    setItems(allItems);
    setLoading(false);
  }, [user, activeSolo]);

  useEffect(() => { fetchArenaItems(); }, [fetchArenaItems]);

  const pendingItems = items.filter(i => !i.alreadySubmitted);
  const submittedItems = items.filter(i => i.alreadySubmitted);
  const totalPending = pendingItems.length;

  const handleSubmit = async () => {
    if (!selectedItem || !url.trim() || !user || !profile) return;
    setSubmitting(true);
    try {
      if (selectedItem.type === "solo" && selectedItem.soloId) {
        const ok = await submitSolo(selectedItem.soloId, url.trim(), platform);
        if (ok) toast.success("Solo submitted! A judge will score it soon.");
        else toast.error("Failed to submit solo");
      } else if (selectedItem.type === "battle") {
        const { data: battle } = await supabase.from("battles").select("challenger_id").eq("id", selectedItem.id).single();
        const isChallenger = battle?.challenger_id === user.id;
        const updateField = isChallenger
          ? { challenger_submission_url: url.trim(), challenger_submission_platform: platform, challenger_submitted_at: new Date().toISOString() }
          : { opponent_submission_url: url.trim(), opponent_submission_platform: platform, opponent_submitted_at: new Date().toISOString() };
        const { error } = await supabase.from("battles").update(updateField).eq("id", selectedItem.id);
        if (!error) toast.success("Battle submission uploaded!"); else toast.error("Failed to submit");
      } else if (selectedItem.type === "drop") {
        const { error } = await supabase.from("featured_submissions").insert({
          drop_id: selectedItem.id, user_id: user.id, username: profile.username || "Unknown",
          avatar_url: profile.avatar_url || null, submission_url: url.trim(), platform, status: "pending",
        });
        if (!error) toast.success("Drop submission sent!"); else toast.error("Failed to submit");
      } else if (selectedItem.type === "hosted_comp") {
        const { error } = await supabase.from("hosted_competition_submissions" as any).insert({
          competition_id: selectedItem.id, user_id: user.id, username: profile.username || "Unknown",
          avatar_url: profile.avatar_url || null, submission_url: url.trim(), platform,
        });
        if (!error) toast.success("Competition submission sent!"); else toast.error("Failed to submit");
      } else if (selectedItem.type === "event") {
        const { error } = await supabase.from("event_participations").insert({
          event_id: selectedItem.id, user_id: user.id, submission_url: url.trim(),
          platform: platform as "youtube" | "tiktok" | "instagram", status: "submitted",
        });
        if (!error) toast.success("Event submission sent!"); else toast.error("Failed to submit");
      }
      setSelectedItem(null); setUrl(""); await fetchArenaItems();
    } catch { toast.error("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  const formatDeadline = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m left`;
    if (hrs < 24) return `${hrs}h left`;
    return `${Math.floor(hrs / 24)}d left`;
  };

  // ─── GUEST MODE: Show a sleek promo rail ───
  if (!user) {
    if (items.length === 0 && !loading) return null;
    return (
      <div className="relative overflow-hidden rounded-xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(20,20,28,0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Subtle animated gradient glow */}
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(239,68,68,0.08), transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(153,153,255,0.06), transparent 60%)" }}
        />

        <div className="relative px-4 py-3">
          <div className="flex items-center gap-2 mb-2.5">
            <Inbox className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.15em]"
              style={{ fontFamily: "'Teko', sans-serif", fontSize: "14px", letterSpacing: "0.12em" }}
            >
              Active Submissions
            </span>
            {items.length > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">
                {items.length} open
              </span>
            )}
          </div>

          {/* Horizontal scrolling rail */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {loading ? (
              <div className="flex items-center gap-2 py-3 px-4">
                <Loader2 className="w-3.5 h-3.5 text-white/15 animate-spin" />
                <span className="text-[11px] text-white/20">Loading...</span>
              </div>
            ) : items.map(item => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => navigate("/auth")}
                className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all hover:scale-[1.03] active:scale-[0.98] group/card"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  minWidth: isMobile ? "200px" : "220px",
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}
                >
                  <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] font-semibold text-white/70 truncate group-hover/card:text-white/90 transition-colors">{item.label}</p>
                  <p className="text-[9px] text-white/25 truncate">{item.subLabel}</p>
                </div>
                {item.deadline && (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}
                  >
                    {formatDeadline(item.deadline)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sign in CTA */}
          <button
            onClick={() => navigate("/auth")}
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-white/[0.04] w-full justify-center group/signin"
            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <LogIn className="w-3 h-3 text-white/30 group-hover/signin:text-white/50 transition-colors" />
            <span className="text-[11px] font-semibold text-white/35 group-hover/signin:text-white/60 transition-colors">
              Sign in to submit your edits
            </span>
            <ArrowRight className="w-3 h-3 text-white/20" />
          </button>
        </div>
      </div>
    );
  }

  // ─── LOGGED IN: Full submit hub ───
  return (
    <div className="relative overflow-hidden rounded-xl"
      style={{
        background: "linear-gradient(180deg, rgba(18,18,22,0.98) 0%, rgba(12,12,16,0.95) 100%)",
        border: totalPending > 0 ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Top accent line */}
      {totalPending > 0 && (
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, #EF4444, #FF6B35, #FFD700, transparent)" }}
        />
      )}

      {/* Ambient glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: totalPending > 0
          ? "radial-gradient(ellipse at 30% 0%, rgba(239,68,68,0.1), transparent 50%), radial-gradient(ellipse at 70% 0%, rgba(255,165,0,0.06), transparent 50%)"
          : "none"
        }}
      />

      <div className="relative">
        {/* ─── Header Row ─── */}
        <div className={`flex items-center justify-between ${isMobile ? "px-3 py-2.5" : "px-5 py-3"}`}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: totalPending > 0 ? "linear-gradient(135deg, #EF4444, #FF6B35)" : "rgba(255,255,255,0.06)" }}
              >
                <Send className={`w-3.5 h-3.5 ${totalPending > 0 ? "text-white" : "text-white/40"}`} />
              </div>
              {totalPending > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                  style={{ background: "#EF4444", boxShadow: "0 0 8px rgba(239,68,68,0.5)" }}
                >
                  {totalPending}
                </motion.div>
              )}
            </div>
            <div>
              <h2 className="text-white/90 font-bold leading-none"
                style={{ fontFamily: "'Teko', sans-serif", fontSize: isMobile ? "16px" : "18px", letterSpacing: "0.06em" }}
              >
                SUBMIT HUB
              </h2>
              <p className="text-[9px] text-white/25 mt-0.5">
                {totalPending > 0 ? `${totalPending} waiting for your edit` : "All caught up"}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/arena")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-semibold text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all"
          >
            Arena <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* ─── Scrollable Item Rail ─── */}
        {(loading || items.length > 0) && (
          <div className={`${isMobile ? "px-3" : "px-5"} pb-3`}>
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 rounded-lg animate-pulse"
                    style={{ width: isMobile ? "180px" : "200px", height: "72px", background: "rgba(255,255,255,0.03)" }}
                  />
                ))
              ) : (
                <>
                  {/* Pending items first */}
                  {pendingItems.map(item => {
                    const isSelected = selectedItem?.id === item.id && selectedItem?.type === item.type;
                    return (
                      <motion.button
                        key={`${item.type}-${item.id}`}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          if (!user) { navigate("/auth"); return; }
                          setSelectedItem(isSelected ? null : item);
                          setUrl("");
                        }}
                        className="flex-shrink-0 relative overflow-hidden rounded-lg transition-all group/card"
                        style={{
                          minWidth: isMobile ? "175px" : "200px",
                          background: isSelected ? `${item.color}10` : "rgba(255,255,255,0.02)",
                          border: isSelected ? `1px solid ${item.color}40` : "1px solid rgba(255,255,255,0.05)",
                          boxShadow: isSelected ? `0 0 20px ${item.color}15` : "none",
                        }}
                      >
                        {/* Glow strip at top */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover/card:opacity-100 transition-opacity"
                          style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }}
                        />

                        <div className="p-3 flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${item.color}12`, border: `1px solid ${item.color}18` }}
                          >
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-[11px] font-bold text-white/80 truncate group-hover/card:text-white transition-colors leading-tight">
                              {item.label}
                            </p>
                            <p className="text-[9px] text-white/25 truncate mt-0.5">{item.subLabel}</p>
                            {item.deadline && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <div className="w-1 h-1 rounded-full animate-pulse"
                                  style={{ background: formatDeadline(item.deadline) === "Ended" ? "#EF4444" : "#10B981" }}
                                />
                                <span className="text-[8px] font-bold uppercase tracking-wider"
                                  style={{ color: formatDeadline(item.deadline) === "Ended" ? "#EF4444" : "rgba(255,255,255,0.3)" }}
                                >
                                  {formatDeadline(item.deadline)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}

                  {/* Submitted items - muted */}
                  {submittedItems.map(item => (
                    <div
                      key={`done-${item.type}-${item.id}`}
                      className="flex-shrink-0 rounded-lg opacity-35"
                      style={{
                        minWidth: isMobile ? "160px" : "180px",
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      <div className="p-3 flex items-center gap-2.5">
                        <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
                        <p className="text-[10px] text-white/40 truncate flex-1">{item.label}</p>
                        <span className="text-[8px] text-emerald-400/70 font-bold">✓</span>
                      </div>
                    </div>
                  ))}

                  {/* Empty state card */}
                  {items.length === 0 && !loading && (
                    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-4 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", minWidth: "240px" }}
                    >
                      <Trophy className="w-4 h-4 text-white/10" />
                      <div>
                        <p className="text-[11px] text-white/25 font-medium">Nothing to submit</p>
                        <p className="text-[9px] text-white/15 mt-0.5">Start a solo or join a drop in Arena</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── Inline Submit Form (slides down when item selected) ─── */}
        <AnimatePresence>
          {selectedItem && user && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className={`${isMobile ? "px-3 pb-3" : "px-5 pb-4"}`}>
                <div className="rounded-xl overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    border: `1px solid ${selectedItem.color}20`,
                  }}
                >
                  {/* Form header */}
                  <div className="flex items-center justify-between px-3 py-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center"
                        style={{ background: `${selectedItem.color}15` }}
                      >
                        <selectedItem.icon className="w-2.5 h-2.5" style={{ color: selectedItem.color }} />
                      </div>
                      <span className="text-[11px] font-bold text-white/70 truncate max-w-[200px]">
                        {selectedItem.label}
                      </span>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="p-1 rounded-md hover:bg-white/[0.06] transition-colors">
                      <X className="w-3 h-3 text-white/30" />
                    </button>
                  </div>

                  <div className="p-3 space-y-2.5">
                    {/* Platform selector — pill style */}
                    <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                      {(["youtube", "tiktok", "instagram"] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setPlatform(p)}
                          className="flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all"
                          style={{
                            background: platform === p ? "rgba(255,255,255,0.95)" : "transparent",
                            color: platform === p ? "#000" : "rgba(255,255,255,0.3)",
                          }}
                        >
                          {p === "youtube" ? "YT" : p === "tiktok" ? "TT" : "IG"}
                        </button>
                      ))}
                    </div>

                    {/* URL input + submit button inline */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste your video URL..."
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        className="flex-1 h-10 bg-white/[0.04] border-white/[0.08] text-[13px] text-white placeholder:text-white/15 rounded-lg focus:border-white/20"
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmit}
                        disabled={submitting || !url.trim()}
                        className="h-10 px-5 rounded-lg flex items-center gap-2 font-bold text-[12px] text-white transition-all disabled:opacity-30 hover:brightness-110"
                        style={{
                          background: "linear-gradient(135deg, #10B981, #059669)",
                          boxShadow: url.trim() ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
                        }}
                      >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {!isMobile && (submitting ? "Sending..." : "Submit")}
                      </motion.button>
                    </div>

                    {/* Reward hint */}
                    <div className="flex items-center gap-1.5 justify-center pt-0.5">
                      <Zap className="w-2.5 h-2.5 text-yellow-400/40" />
                      <span className="text-[9px] text-white/20 font-medium">Earn Index points when your edit is scored</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}