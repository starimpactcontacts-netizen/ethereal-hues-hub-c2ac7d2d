import { Link } from "react-router-dom";
import { Music, Clock, Flame, Crown } from "lucide-react";
import { CollabSlot } from "@/hooks/useCollabs";

function Avatar({ url, name, ring }: { url: string | null; name: string; ring: string }) {
  return (
    <div
      className={`w-10 h-10 rounded-full overflow-hidden border-2 ${ring} bg-[#1a1a1f] flex items-center justify-center text-[11px] font-bold text-white/70`}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  open: { label: "OPEN", cls: "border border-violet-400/60 text-violet-300 bg-violet-500/10" },
  paired: { label: "PAIRED", cls: "bg-violet-500 text-white" },
  editing: { label: "EDITING", cls: "bg-amber-500 text-black" },
  pending_approval: { label: "PENDING APPROVAL", cls: "bg-amber-500/20 text-amber-300 border border-amber-400/40" },
  live: { label: "LIVE", cls: "bg-emerald-500 text-black" },
  expired: { label: "EXPIRED", cls: "bg-zinc-700 text-zinc-300" },
  rejected: { label: "REJECTED", cls: "bg-red-500/20 text-red-300 border border-red-400/40" },
};

export default function CollabSlotCard({ slot, rank }: { slot: CollabSlot; rank?: number }) {
  const pill = STATUS_PILL[slot.status] ?? STATUS_PILL.open;

  return (
    <Link
      to={`/collab/${slot.id}`}
      className="block rounded-3xl p-[1.5px] transition-all active:translate-y-[2px] shadow-[0_6px_0_rgba(0,0,0,0.4)]"
      style={{
        background:
          slot.status === "live"
            ? "linear-gradient(135deg, rgba(168,85,247,0.8), rgba(255,255,255,0.1), rgba(16,185,129,0.6))"
            : "linear-gradient(135deg, rgba(168,85,247,0.7), rgba(255,255,255,0.08), rgba(124,58,237,0.55))",
      }}
    >
      <div
        className="rounded-[22px] p-3.5 relative overflow-hidden backdrop-blur-md"
        style={{
          background:
            "linear-gradient(160deg, rgba(46,21,77,0.92) 0%, rgba(20,10,40,0.92) 50%, rgba(8,4,18,0.95) 100%)",
        }}
      >
        {/* Violet glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-10 w-40 h-40 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%)" }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${pill.cls}`}
            >
              {pill.label}
            </span>
            {rank !== undefined && rank <= 3 && (
              <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> #{rank}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {slot.total_duration_seconds}s
          </span>
        </div>

        {/* Duo avatars */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center -space-x-3">
            <Avatar url={slot.creator_avatar_url} name={slot.creator_username} ring="border-violet-400/70" />
            {slot.partner_id ? (
              <Avatar
                url={slot.partner_avatar_url}
                name={slot.partner_username ?? "?"}
                ring="border-violet-400/70"
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-violet-400/60 bg-violet-500/5 flex items-center justify-center text-[9px] font-bold text-violet-300 uppercase tracking-wider">
                Join
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-foreground font-bold truncate">
              {slot.creator_username}
              {slot.partner_username ? <span className="text-violet-300"> × {slot.partner_username}</span> : <span className="text-muted-foreground"> × ???</span>}
            </p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
              <Music className="w-3 h-3 shrink-0" />
              <span className="truncate">{slot.song_title}{slot.song_artist ? ` — ${slot.song_artist}` : ""}</span>
            </p>
          </div>
        </div>

        {/* Segment briefs */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-lg bg-violet-500/[0.08] border border-violet-400/15 p-2 backdrop-blur-sm">
            <p className="text-[8px] uppercase tracking-widest text-violet-300 font-bold mb-0.5">Half 1</p>
            <p className="text-foreground/80 line-clamp-2">{slot.creator_segment}</p>
          </div>
          <div className="rounded-lg bg-violet-500/[0.08] border border-violet-400/15 p-2 backdrop-blur-sm">
            <p className="text-[8px] uppercase tracking-widest text-violet-300 font-bold mb-0.5">Half 2</p>
            <p className="text-foreground/80 line-clamp-2">{slot.partner_segment}</p>
          </div>
        </div>

        {/* Footer reactions */}
        {slot.status === "live" && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-violet-400/15">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              {slot.total_reactions > 0 ? `${slot.reaction_score} fire score` : "Be the first to react"}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Watch →</span>
          </div>
        )}
        {slot.status === "open" && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-violet-400/15">
            <span className="text-[10px] text-muted-foreground">Looking for a partner</span>
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Join →</span>
          </div>
        )}
      </div>
    </Link>
  );
}