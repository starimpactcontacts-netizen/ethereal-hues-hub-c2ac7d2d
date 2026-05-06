import { motion } from "framer-motion";
import { ArrowLeft, Clock, Copy, Eye, Music, Share2, Swords, UserPlus, Users, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BattleSongPicker from "@/components/loopgate/BattleSongPicker";
import type { OpenQueueEntry, QuickFight } from "@/hooks/useQuickFight";

interface CustomEditBattleLobbyProps {
  fight: QuickFight;
  isHost: boolean;
  viewerId?: string;
  openQueue: OpenQueueEntry[];
  onBack: () => void;
  onShare: () => void;
  onCopy: () => void;
  onJoin: () => void;
  onCancel: () => void;
  onSongPicked: (drop: any) => Promise<void>;
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-h-[72px] rounded-xl border border-border/60 bg-surface-1/80 flex flex-col items-center justify-center">
      <span className="text-[26px] leading-none font-black text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>{value}</span>
      <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
    </div>
  );
}

export default function CustomEditBattleLobby({
  fight,
  isHost,
  viewerId,
  openQueue,
  onBack,
  onShare,
  onCopy,
  onJoin,
  onCancel,
  onSongPicked,
}: CustomEditBattleLobbyProps) {
  const duration = fight.duration_minutes >= 60 ? `${Math.round(fight.duration_minutes / 60)}H` : `${fight.duration_minutes}M`;
  const otherEditors = openQueue.filter((entry) => entry.user_id !== fight.player_1_id && entry.user_id !== viewerId).slice(0, 5);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,hsl(var(--surface-0))_0%,hsl(var(--background))_54%,hsl(var(--surface-0))_100%)]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 opacity-[0.16]" style={{ backgroundImage: "linear-gradient(hsl(var(--foreground) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.08) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />

      <header className="sticky top-0 z-30 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="h-9 px-2 -ml-2 flex items-center gap-2 text-muted-foreground active:scale-95 transition-transform">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">Arena</span>
          </button>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
              <Eye className="w-3.5 h-3.5" />
              {fight.view_count || 1}
            </div>
            <button onClick={onShare} className="h-9 w-9 grid place-items-center rounded-lg border border-border/60 bg-surface-1/70 active:scale-95 transition-transform" aria-label="Share lobby">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+28px)]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
            Open Challenge
            <span className="text-gold flex items-center gap-1"><Zap className="w-3 h-3" />Rapid</span>
          </div>
          <h1 className="mt-3 text-center text-[46px] leading-[0.88] font-black uppercase text-foreground" style={{ fontFamily: "Teko, sans-serif" }}>
            Custom Edit Battle
          </h1>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.24 }}
          className="relative mt-5 overflow-hidden rounded-2xl border border-border bg-surface-1 min-h-[258px]"
        >
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,hsl(217_91%_60%/0.18),transparent_32%),radial-gradient(circle_at_82%_24%,hsl(0_72%_51%/0.18),transparent_34%)]" />
          <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,hsl(217_91%_60%),transparent_46%,transparent_54%,hsl(0_72%_51%))]" />

          <div className="relative px-5 pt-5 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Lobby Live</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
              <Music className="w-3.5 h-3.5 text-gold" /> Queue Song
            </div>
          </div>

          <div className="relative px-5 pt-8 pb-6 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="relative">
                <span className="absolute -inset-2 rounded-full bg-blue-500/20 blur-lg" />
                <Avatar className="relative w-[78px] h-[78px] border-2 border-blue-500/45">
                  <AvatarImage src={fight.player_1_avatar_url || ""} />
                  <AvatarFallback className="bg-surface-2 text-blue-300 text-2xl font-black">
                    {fight.player_1_username?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="mt-3 max-w-[110px] truncate text-[17px] leading-none font-black uppercase text-blue-200" style={{ fontFamily: "Teko, sans-serif" }}>
                {fight.player_1_username}
              </span>
              {isHost && <span className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/80">You</span>}
            </div>

            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="relative w-[54px] h-[54px] rounded-full border border-border bg-background grid place-items-center">
                <span className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" />
                <Swords className="w-6 h-6 text-foreground" />
              </div>
              <span className="text-[13px] font-black uppercase tracking-[0.18em] text-muted-foreground" style={{ fontFamily: "Teko, sans-serif" }}>VS</span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="w-[78px] h-[78px] rounded-full border-2 border-dashed border-red-500/35 bg-background/60 grid place-items-center">
                <span className="text-[30px] font-black text-red-400/45" style={{ fontFamily: "Teko, sans-serif" }}>?</span>
              </div>
              <span className="mt-3 max-w-[110px] truncate text-[17px] leading-none font-black uppercase text-red-200" style={{ fontFamily: "Teko, sans-serif" }}>
                Open Slot
              </span>
              <span className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-red-400/80">Tap In</span>
            </div>
          </div>
        </motion.section>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatTile value="+50" label="Winner" />
          <StatTile value="-10" label="Loser" />
          <StatTile value={duration} label="Duration" />
        </div>

        <div className="mt-4 space-y-3">
          {isHost && (
            <div className="rounded-2xl border border-border/70 bg-surface-1/70 p-2">
              <BattleSongPicker onSongPicked={onSongPicked} selectedSongName={(fight as any).theme_song_name} compact />
            </div>
          )}

          {isHost ? (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button onClick={onShare} className="h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-[14px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform" style={{ fontFamily: "Teko, sans-serif" }}>
                <Users className="w-4 h-4" /> Invite
              </button>
              <button onClick={onCopy} className="h-14 w-14 rounded-xl border border-border bg-surface-1 grid place-items-center text-muted-foreground active:scale-[0.96] transition-transform" aria-label="Copy lobby link">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={onJoin} className="h-[60px] w-full rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-[16px] font-black uppercase tracking-[0.14em] active:scale-[0.98] transition-transform" style={{ fontFamily: "Teko, sans-serif" }}>
              <UserPlus className="w-5 h-5" /> Accept Battle
            </button>
          )}

          <div className="rounded-2xl border border-border/70 bg-surface-1/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Open in carousel</p>
                <p className="mt-0.5 text-[13px] text-foreground/80 truncate">Visible as an edit battle card</p>
              </div>
              <div className="flex -space-x-2 shrink-0">
                {otherEditors.length > 0 ? otherEditors.map((editor) => (
                  <Avatar key={editor.id} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={editor.avatar_url || ""} />
                    <AvatarFallback className="bg-surface-2 text-[10px] font-bold">{editor.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                )) : (
                  <div className="h-8 px-3 rounded-full border border-border bg-background/70 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    <Clock className="w-3 h-3" /> First Open
                  </div>
                )}
              </div>
            </div>
          </div>

          {isHost && (
            <button onClick={onCancel} className="w-full h-12 rounded-xl border border-border bg-background/50 text-muted-foreground text-[11px] font-black uppercase tracking-[0.22em] active:scale-[0.98] transition-transform" style={{ fontFamily: "Teko, sans-serif" }}>
              Cancel Lobby
            </button>
          )}
        </div>
      </main>
    </div>
  );
}