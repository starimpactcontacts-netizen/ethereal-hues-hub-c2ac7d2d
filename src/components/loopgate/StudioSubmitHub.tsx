import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Trophy, ChevronDown, ChevronUp, Loader2, X,
  Swords, Flame, Music, Target, Users, Zap, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSoloMode } from "@/hooks/useSoloMode";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ACCENT = "#9999FF";
const GOLD = "#FFD700";

type SubmittableItem = {
  id: string;
  type: "solo" | "battle" | "drop" | "hosted_comp" | "event";
  label: string;
  subLabel: string;
  icon: typeof Swords;
  color: string;
  deadline?: string;
  alreadySubmitted?: boolean;
  /** For solo mode - need theme/song info */
  soloId?: string;
};

export default function StudioSubmitHub() {
  const { user, profile } = useAuth();
  const { activeSolo, submitEdit: submitSolo } = useSoloMode();
  const navigate = useNavigate();
  const [items, setItems] = useState<SubmittableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SubmittableItem | null>(null);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [submitting, setSubmitting] = useState(false);

  const fetchArenaItems = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const allItems: SubmittableItem[] = [];

    // 1. Active Solo
    if (activeSolo && (activeSolo.status === "editing" || activeSolo.status === "picking_song")) {
      allItems.push({
        id: activeSolo.id,
        type: "solo",
        label: `Solo — ${activeSolo.theme}`,
        subLabel: activeSolo.song_name,
        icon: Flame,
        color: "#FF6B35",
        soloId: activeSolo.id,
      });
    }

    // 2. Active Battles (where user needs to submit)
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
        const alreadySubmitted = isChallenger ? !!b.challenger_submission_url : !!b.opponent_submission_url;
        const opponentName = isChallenger ? (b.opponent_username || "Opponent") : (b.challenger_username || "Challenger");
        allItems.push({
          id: b.id,
          type: "battle",
          label: `1v1 vs ${opponentName}`,
          subLabel: b.theme_song_name || "Battle",
          icon: Swords,
          color: "#EF4444",
          deadline: b.ends_at || undefined,
          alreadySubmitted,
        });
      }
    }

    // 3. Active Featured Drops (with open submissions)
    const { data: drops } = await supabase
      .from("featured_drops")
      .select("id, title, song_name, status, ends_at")
      .in("status", ["active", "submissions_open"])
      .order("created_at", { ascending: false })
      .limit(10);

    if (drops) {
      // Check if user already submitted to each
      const dropIds = drops.map(d => d.id);
      const { data: existingSubs } = await supabase
        .from("featured_submissions")
        .select("drop_id")
        .eq("user_id", user.id)
        .in("drop_id", dropIds);
      const submittedDropIds = new Set((existingSubs || []).map(s => (s as any).drop_id));

      for (const d of drops) {
        allItems.push({
          id: d.id,
          type: "drop",
          label: d.title,
          subLabel: `🎵 ${d.song_name}`,
          icon: Music,
          color: "#8B5CF6",
          deadline: d.ends_at || undefined,
          alreadySubmitted: submittedDropIds.has(d.id),
        });
      }
    }

    // 4. Hosted Competitions user joined
    const { data: joinedComps } = await supabase
      .from("hosted_competition_participants" as any)
      .select("competition_id")
      .eq("user_id", user.id);

    if (joinedComps && joinedComps.length > 0) {
      const compIds = joinedComps.map((j: any) => j.competition_id);
      const { data: comps } = await supabase
        .from("hosted_competitions" as any)
        .select("id, name, submission_deadline, status")
        .in("id", compIds)
        .in("status", ["open", "active", "submissions_open"]);

      if (comps) {
        // Check existing submissions
        const { data: compSubs } = await supabase
          .from("hosted_competition_submissions" as any)
          .select("competition_id")
          .eq("user_id", user.id)
          .in("competition_id", compIds);
        const submittedCompIds = new Set((compSubs || []).map((s: any) => s.competition_id));

        for (const c of comps as any[]) {
          allItems.push({
            id: c.id,
            type: "hosted_comp",
            label: c.name,
            subLabel: "Community Competition",
            icon: Users,
            color: "#06B6D4",
            deadline: c.submission_deadline || undefined,
            alreadySubmitted: submittedCompIds.has(c.id),
          });
        }
      }
    }

    // 5. Active Events user can submit to
    const { data: events } = await supabase
      .from("events")
      .select("id, title, end_date, status")
      .in("status", ["active", "submissions_open"])
      .order("start_date", { ascending: false })
      .limit(10);

    if (events) {
      const eventIds = events.map(e => e.id);
      const { data: eventSubs } = await supabase
        .from("event_participations")
        .select("event_id")
        .eq("user_id", user.id)
        .in("event_id", eventIds);
      const submittedEventIds = new Set((eventSubs || []).map(s => s.event_id));

      for (const e of events) {
        allItems.push({
          id: e.id,
          type: "event",
          label: e.title,
          subLabel: "Official Event",
          icon: Target,
          color: "#F59E0B",
          deadline: e.end_date || undefined,
          alreadySubmitted: submittedEventIds.has(e.id),
        });
      }
    }

    setItems(allItems);
    setLoading(false);
  }, [user, activeSolo]);

  useEffect(() => { fetchArenaItems(); }, [fetchArenaItems]);

  const pendingItems = items.filter(i => !i.alreadySubmitted);
  const submittedItems = items.filter(i => i.alreadySubmitted);

  const handleSubmit = async () => {
    if (!selectedItem) return;
    if (!url.trim()) { toast.error("Paste your video link"); return; }
    if (!user || !profile) return;

    setSubmitting(true);

    try {
      if (selectedItem.type === "solo" && selectedItem.soloId) {
        const ok = await submitSolo(selectedItem.soloId, url.trim(), platform);
        if (ok) toast.success("Solo submitted! A judge will score it soon.");
        else toast.error("Failed to submit solo");
      } else if (selectedItem.type === "battle") {
        // Determine if challenger or opponent
        const { data: battle } = await supabase
          .from("battles")
          .select("challenger_id")
          .eq("id", selectedItem.id)
          .single();
        const isChallenger = battle?.challenger_id === user.id;
        const updateField = isChallenger
          ? { challenger_submission_url: url.trim(), challenger_submission_platform: platform, challenger_submitted_at: new Date().toISOString() }
          : { opponent_submission_url: url.trim(), opponent_submission_platform: platform, opponent_submitted_at: new Date().toISOString() };
        const { error } = await supabase.from("battles").update(updateField).eq("id", selectedItem.id);
        if (!error) toast.success("Battle submission uploaded!");
        else toast.error("Failed to submit");
      } else if (selectedItem.type === "drop") {
        const { error } = await supabase.from("featured_submissions").insert({
          drop_id: selectedItem.id,
          user_id: user.id,
          username: profile.username || "Unknown",
          avatar_url: profile.avatar_url || null,
          submission_url: url.trim(),
          platform,
          status: "pending",
        });
        if (!error) toast.success("Drop submission sent!");
        else toast.error("Failed to submit");
      } else if (selectedItem.type === "hosted_comp") {
        const { error } = await supabase.from("hosted_competition_submissions" as any).insert({
          competition_id: selectedItem.id,
          user_id: user.id,
          username: profile.username || "Unknown",
          avatar_url: profile.avatar_url || null,
          submission_url: url.trim(),
          platform,
        });
        if (!error) toast.success("Competition submission sent!");
        else toast.error("Failed to submit");
      } else if (selectedItem.type === "event") {
        const { error } = await supabase.from("event_participations").insert({
          event_id: selectedItem.id,
          user_id: user.id,
          submission_url: url.trim(),
          platform: platform as "youtube" | "tiktok" | "instagram",
          status: "submitted",
        });
        if (!error) toast.success("Event submission sent!");
        else toast.error("Failed to submit");
      }

      setSelectedItem(null);
      setUrl("");
      await fetchArenaItems();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDeadline = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m left`;
    if (hrs < 24) return `${hrs}h left`;
    return `${Math.floor(hrs / 24)}d left`;
  };

  if (!user || (items.length === 0 && !loading)) return null;

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.04) 0%, rgba(20,20,28,0.8) 50%, rgba(255,165,0,0.03) 100%)", border: "1px solid rgba(255,215,0,0.12)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)" }}
          >
            <Send className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="text-left">
            <span className="text-[13px] font-bold text-white/90">Submission Hub</span>
            {pendingItems.length > 0 && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,215,0,0.15)", color: GOLD }}
              >
                {pendingItems.length} pending
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-3 h-3 text-white/20 animate-spin" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {/* Info text */}
              <p className="text-[10px] text-white/30 leading-relaxed">
                Submit your edit for any active arena item below. Made your edit in CapCut, Premiere, or any other tool? Upload it to a platform and paste the link.
              </p>

              {/* Pending items */}
              {pendingItems.length === 0 && !loading && (
                <div className="py-4 text-center">
                  <Trophy className="w-5 h-5 text-white/10 mx-auto mb-1" />
                  <p className="text-[11px] text-white/25">No active arena items to submit for</p>
                  <button onClick={() => navigate("/arena")} className="text-[10px] font-semibold mt-1 hover:underline" style={{ color: ACCENT }}>
                    Go to Arena →
                  </button>
                </div>
              )}

              {pendingItems.map(item => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => { setSelectedItem(item); setUrl(""); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group/item hover:scale-[1.01]"
                  style={{
                    background: selectedItem?.id === item.id && selectedItem?.type === item.type
                      ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.02)",
                    border: selectedItem?.id === item.id && selectedItem?.type === item.type
                      ? "1px solid rgba(255,215,0,0.2)" : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}
                  >
                    <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white/80 truncate group-hover/item:text-white/95 transition-colors">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-white/30 truncate">{item.subLabel}</p>
                  </div>
                  {item.deadline && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: formatDeadline(item.deadline) === "Ended" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                        color: formatDeadline(item.deadline) === "Ended" ? "#EF4444" : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {formatDeadline(item.deadline)}
                    </span>
                  )}
                  <Send className="w-3 h-3 text-white/15 group-hover/item:text-white/40 transition-colors flex-shrink-0" />
                </button>
              ))}

              {/* Already submitted */}
              {submittedItems.length > 0 && (
                <div className="pt-1">
                  <p className="text-[9px] text-white/20 font-semibold uppercase tracking-[0.15em] mb-1.5">Already Submitted</p>
                  {submittedItems.map(item => (
                    <div key={`${item.type}-${item.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg opacity-40"
                      style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}
                    >
                      <item.icon className="w-3 h-3 flex-shrink-0" style={{ color: item.color }} />
                      <p className="text-[11px] text-white/40 truncate flex-1">{item.label}</p>
                      <span className="text-[9px] text-emerald-400/60 font-semibold">✓ Sent</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit form (when item selected) */}
              <AnimatePresence>
                {selectedItem && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-3 rounded-lg" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.1)" }}>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3" style={{ color: GOLD }} />
                          <span className="text-[11px] font-bold" style={{ color: GOLD }}>
                            Submit for: {selectedItem.label.length > 30 ? selectedItem.label.slice(0, 30) + "..." : selectedItem.label}
                          </span>
                        </div>
                        <button onClick={() => setSelectedItem(null)} className="p-0.5 rounded hover:bg-white/[0.06]">
                          <X className="w-3 h-3 text-white/30" />
                        </button>
                      </div>

                      {/* Platform picker */}
                      <div className="flex gap-1.5 mb-2">
                        {["youtube", "tiktok", "instagram"].map(p => (
                          <button
                            key={p}
                            onClick={() => setPlatform(p)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
                            style={{
                              background: platform === p ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.05)",
                              color: platform === p ? "#000" : "rgba(255,255,255,0.4)",
                              border: `1px solid ${platform === p ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.08)"}`,
                            }}
                          >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* URL input */}
                      <Input
                        placeholder="Paste your video URL..."
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        className="bg-white/[0.04] border-white/10 text-sm text-white placeholder:text-white/20 rounded-lg mb-2"
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                      />

                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:brightness-110"
                        style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                      >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                        <span className="text-xs font-bold text-white">{submitting ? "Submitting..." : "Submit"}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}