import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Trophy, Loader2, X, DollarSign,
  Swords, Flame, Music, Target, Users, Zap,
  ChevronRight, Inbox, ArrowRight, LogIn,
  Info, Clock, ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSoloMode } from "@/hooks/useSoloMode";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const teko = { fontFamily: "'Teko', sans-serif" };

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
  const [showHelp, setShowHelp] = useState(false);

  const fetchArenaItems = useCallback(async () => {
    if (!user) {
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
            subLabel: "King of the Hill", icon: Target, color: "#F59E0B",
            deadline: e.end_date || undefined,
          });
        }
      }
      setItems(allItems);
      setLoading(false);
      return;
    }

    const allItems: SubmittableItem[] = [];

    if (activeSolo && (activeSolo.status === "editing" || activeSolo.status === "picking_song")) {
      allItems.push({
        id: activeSolo.id, type: "solo",
        label: `Solo — ${activeSolo.theme}`, subLabel: activeSolo.song_name,
        icon: Flame, color: "#FF6B35", soloId: activeSolo.id,
      });
    }

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
          subLabel: "King of the Hill", icon: Target, color: "#F59E0B",
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

  // ─── GUEST MODE ───
  if (!user) {
    if (items.length === 0 && !loading) return null;
    return (
      <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2.5">
          <Inbox className="w-4 h-4 text-muted-foreground/50" />
          <span className="text-[14px] font-extrabold uppercase tracking-[0.08em] text-foreground/80" style={teko}>
            Active Submissions
          </span>
          {items.length > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {items.length} open
            </span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 px-4 scrollbar-none">
          {loading ? (
            <div className="flex items-center gap-2 py-3 px-4">
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground/30 animate-spin" />
              <span className="text-[11px] text-muted-foreground/40">Loading...</span>
            </div>
          ) : items.map(item => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => navigate("/auth")}
              className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50 border border-border/30 transition-all hover:bg-muted active:scale-[0.98]"
              style={{ minWidth: isMobile ? "200px" : "220px" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}12`, border: `1px solid ${item.color}20` }}
              >
                <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-semibold text-foreground/70 truncate">{item.label}</p>
                <p className="text-[9px] text-muted-foreground/50 truncate">{item.subLabel}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("/auth")}
          className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/30 w-[calc(100%-2rem)] justify-center hover:bg-muted/50 transition-all"
        >
          <LogIn className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-[11px] font-semibold text-muted-foreground/60">Sign in to submit your edits</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
        </button>
      </div>
    );
  }

  // ─── LOGGED IN ───
  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between ${isMobile ? "px-4 py-3" : "px-5 py-3.5"}`}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-destructive/10 border border-destructive/20">
              <Send className="w-3.5 h-3.5 text-destructive" />
            </div>
            {totalPending > 0 && (
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black bg-destructive text-destructive-foreground"
                style={{ boxShadow: "0 0 8px hsl(var(--destructive) / 0.4)" }}
              >
                {totalPending}
              </motion.div>
            )}
          </div>
          <div>
            <h2 className="text-foreground/90 font-extrabold leading-none uppercase tracking-[0.06em]"
              style={{ ...teko, fontSize: isMobile ? "16px" : "18px" }}
            >
              SUBMIT HUB
            </h2>
            <p className="text-[9px] text-muted-foreground/50 mt-0.5">
              {totalPending > 0 ? `${totalPending} waiting for your edit` : "All caught up"}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/arena")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-muted-foreground/50 hover:text-foreground/70 hover:bg-muted/50 transition-all"
        >
          Arena <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Item Rail */}
      {(loading || items.length > 0) && (
        <div className={`${isMobile ? "px-4" : "px-5"} pb-3`}>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 rounded-xl animate-pulse bg-muted/30"
                  style={{ width: isMobile ? "180px" : "200px", height: "72px" }}
                />
              ))
            ) : (
              <>
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
                      className={`flex-shrink-0 relative rounded-xl transition-all ${
                        isSelected ? "bg-accent/60 border-accent-foreground/10" : "bg-muted/30 hover:bg-muted/50 border-border/30"
                      } border`}
                      style={{ minWidth: isMobile ? "175px" : "200px" }}
                    >
                      <div className="p-3 flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${item.color}15`, border: `1px solid ${item.color}20` }}
                        >
                          <item.icon className="w-4 h-4" style={{ color: item.color }} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[11px] font-bold text-foreground/80 truncate leading-tight">
                            {item.label}
                          </p>
                          <p className="text-[9px] text-muted-foreground/50 truncate mt-0.5">{item.subLabel}</p>
                          {item.deadline && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="w-2.5 h-2.5 text-muted-foreground/30" />
                              <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground/40">
                                {formatDeadline(item.deadline)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}

                {submittedItems.map(item => (
                  <div
                    key={`done-${item.type}-${item.id}`}
                    className="flex-shrink-0 rounded-xl opacity-40 bg-muted/20 border border-border/20"
                    style={{ minWidth: isMobile ? "160px" : "180px" }}
                  >
                    <div className="p-3 flex items-center gap-2.5">
                      <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color }} />
                      <p className="text-[10px] text-muted-foreground/60 truncate flex-1">{item.label}</p>
                      <span className="text-[8px] text-emerald-400 font-bold">✓</span>
                    </div>
                  </div>
                ))}

                {items.length === 0 && !loading && (
                  <div className="flex-shrink-0 flex items-center gap-3 px-4 py-4 rounded-xl bg-muted/20 border border-border/20"
                    style={{ minWidth: "240px" }}
                  >
                    <Trophy className="w-4 h-4 text-muted-foreground/20" />
                    <div>
                      <p className="text-[11px] text-muted-foreground/40 font-medium">Nothing to submit</p>
                      <p className="text-[9px] text-muted-foreground/25 mt-0.5">Start a solo or join a drop in Arena</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Inline Submit Form */}
      <AnimatePresence>
        {selectedItem && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className={`${isMobile ? "px-4 pb-4" : "px-5 pb-4"}`}>
              <div className="rounded-xl bg-muted/40 border border-border/40 overflow-hidden">
                {/* Active item header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <selectedItem.icon className="w-3.5 h-3.5" style={{ color: selectedItem.color }} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400" style={teko}>
                        Solo Mode Active
                      </p>
                      <p className="text-sm font-bold text-foreground">{selectedItem.label.replace("Solo — ", "")}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
                    <X className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </button>
                </div>

                {/* Song info */}
                <div className="px-3 py-2 flex items-center gap-2 border-b border-border/20">
                  <Music className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <span className="text-[12px] text-muted-foreground/60">{selectedItem.subLabel}</span>
                </div>

                <div className="p-3 space-y-3">
                  {/* Help accordion */}
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex items-center gap-1.5 text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    <span className="text-[11px] font-medium">What do I do?</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showHelp ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showHelp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2 mb-1">
                          <div className="flex items-start gap-2">
                            <Clock className="w-3 h-3 text-amber-400/60 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-muted-foreground/60">
                              <span className="text-amber-400 font-bold">Submit within 24 hours</span> for judges to score it higher.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Platform selector */}
                  <div className="flex gap-1.5">
                    {(["youtube", "tiktok", "instagram"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${
                          platform === p
                            ? "bg-foreground text-background border-foreground"
                            : "bg-transparent text-muted-foreground/40 border-border/40 hover:border-border/60"
                        }`}
                      >
                        {p === "youtube" ? "Youtube" : p === "tiktok" ? "Tiktok" : "Instagram"}
                      </button>
                    ))}
                  </div>

                  {/* URL input */}
                  <Input
                    placeholder="Paste your video URL..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    className="h-11 bg-background/50 border-border/40 text-[13px] text-foreground placeholder:text-muted-foreground/25 rounded-xl focus:border-border"
                  />

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !url.trim()}
                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2.5 font-extrabold text-[15px] uppercase tracking-[0.1em] transition-all active:scale-[0.98] disabled:opacity-30 bg-emerald-500 hover:bg-emerald-400 text-white"
                    style={teko}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Edit
                      </>
                    )}
                  </button>

                  {/* Reward hint */}
                  <div className="flex items-center gap-1.5 justify-center">
                    <Trophy className="w-3 h-3 text-amber-400/40" />
                    <span className="text-[10px] text-muted-foreground/40 font-medium">
                      Earn up to 100+ Index when a judge scores your edit
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
