import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  ExternalLink,
  Flame,
  Medal,
  MessageCircle,
  Play,
  Send,
  Swords,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import GateIcon from "@/components/loopgate/GateIcon";
import RingsCoin from "@/components/loopgate/RingsCoin";
import { useRealEvents, useEventRankings, useEventStats, useActiveSession } from "@/hooks/useRealData";
import { useEventRounds, useUserRoundStatus } from "@/hooks/useOpenArenaData";
import { useAuth } from "@/hooks/useAuth";
import CountdownTimer from "@/components/loopgate/CountdownTimer";
import SubmissionModal from "@/components/loopgate/SubmissionModal";
import ShowcaseUploadModal from "@/components/loopgate/ShowcaseUploadModal";
import OpenArenaRoundLeaderboard from "@/components/loopgate/OpenArenaRoundLeaderboard";
import OpenArenaGuide, { OpenArenaInfoButton } from "@/components/loopgate/OpenArenaGuide";
import { Badge } from "@/components/ui/badge";
import EventChatSheet from "@/components/loopgate/EventChatSheet";
import { useEventChatUnread } from "@/hooks/useEventChatUnread";
import lightYagamiPoster from "@/assets/light_yagami_poster.jpg";
import fixMySoulCover from "@/assets/fix_my_soul_cover.jpg";

const displayFont = { fontFamily: "Teko, Inter, system-ui, sans-serif" };
const bodyFont = { fontFamily: "Inter, system-ui, sans-serif" };
const LIGHT_YAGAMI_SLUG = "light-yagami-edit-competition";

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showShowcaseUpload, setShowShowcaseUpload] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [ladderLimit, setLadderLimit] = useState(8);
  const ladderRef = useRef<HTMLDivElement | null>(null);

  useActiveSession();

  const { events, loading: eventsLoading } = useRealEvents();
  const event = events.find((e) => e.slug === id || e.id === id);
  const eventId = event?.id || null;

  const { rankings } = useEventRankings(eventId);
  const { stats } = useEventStats(eventId);
  const { rounds } = useEventRounds(eventId);
  const { statuses: userRoundStatuses } = useUserRoundStatus(eventId);
  const { unread: chatUnread } = useEventChatUnread(eventId || undefined);

  const isOpenArena = (event as any)?.event_mode === "open_arena";
  const activeRound = rounds.find((r) => r.status === "active");
  const currentUserStatus = userRoundStatuses.find((s) => s.round_number === activeRound?.round_number);

  useEffect(() => {
    if (isOpenArena && event) {
      const hasSeenGuide = localStorage.getItem("loopgate-guide-open-arena-v1");
      if (!hasSeenGuide) {
        setShowGuide(true);
        localStorage.setItem("loopgate-guide-open-arena-v1", "true");
      }
    }
  }, [isOpenArena, event]);

  if (eventsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-arena-bg">
        <div className="w-8 h-8 border-2 border-arena-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-arena-bg">
        <p className="text-arena-muted">Event not found.</p>
      </div>
    );
  }

  const isLive = event.status === "live";
  const isClosed = event.status === "closed";
  const isLightYagami = event.slug === LIGHT_YAGAMI_SLUG;
  const displayPoster = isLightYagami ? lightYagamiPoster : event.poster_url;
  const featuredEdits = rankings.filter((r) => r.submission_url && (r as any).is_showcase).slice(0, 6);
  const ladderRows = rankings.filter((r) => !(r as any).is_showcase).slice(0, ladderLimit);
  const isShowcaseAdmin = user?.email?.toLowerCase() === "aminhoopz@gmail.com";

  const getUserAdvancementStatus = () => {
    if (!user || !activeRound) return null;
    const status = userRoundStatuses.find((s) => s.round_number === activeRound.round_number);
    if (!status) return "not_entered";
    return status.status;
  };

  const advancementStatus = getUserAdvancementStatus();

  const scrollToLadder = () => {
    ladderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setLadderLimit((current) => Math.max(current, 16));
  };

  return (
    <div className="min-h-screen pb-28 bg-black text-arena-ink" style={bodyFont}>
      <div className="relative overflow-hidden bg-black">
        <img
          src={displayPoster || lightYagamiPoster}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px] scale-105"
          style={{ objectPosition: isLightYagami ? "50% 18%" : "50% 35%" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.88)_46%,#000_100%)]" />

        <div className="relative px-4 pt-[max(env(safe-area-inset-top),14px)] pb-5">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/arena"
              className="w-9 h-9 rounded-lg bg-arena-panel/85 shadow-[0_10px_26px_hsl(var(--arena-bg)/0.45)] flex items-center justify-center active:scale-95 transition"
              aria-label="Back to arena"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-arena-red px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
                </span>
              )}
              {isOpenArena && <OpenArenaInfoButton onClick={() => setShowGuide(true)} />}
              <button
                onClick={() => setShowChat(true)}
                aria-label="Open event chat"
                className="relative w-9 h-9 rounded-lg bg-arena-panel/85 shadow-[0_10px_26px_hsl(var(--arena-bg)/0.45)] flex items-center justify-center active:scale-95 transition"
              >
                <MessageCircle size={18} />
                {chatUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-arena-bg animate-pulse">
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="min-w-0 pb-1">
              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-arena-muted">
                <span className="rounded bg-arena-panel/90 px-2 py-1 shadow-[0_4px_16px_hsl(var(--arena-bg)/0.3)]">Ranked Event</span>
                <span className="rounded bg-arena-panel/90 px-2 py-1 shadow-[0_4px_16px_hsl(var(--arena-bg)/0.3)]">TikTok Only</span>
              </div>
              <h1 className="text-[42px] leading-[0.86] font-black uppercase text-arena-ink" style={displayFont}>
                {event.title}
              </h1>
              {event.subtitle && <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-arena-muted">{event.subtitle}</p>}
          </div>

          {(event as any).end_date && (
            <div className="mt-5 border-2 border-arena-amber bg-black p-3 shadow-[6px_6px_0_#000]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-arena-amber">Time Left to Enter</p>
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-arena-red">
                  <span className="h-1.5 w-1.5 bg-arena-red animate-pulse" /> Act Fast
                </span>
              </div>
              <BigCountdown endDate={(event as any).end_date} />
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-0 border-2 border-arena-ink bg-black">
            <div className="border-r-2 border-arena-ink p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-arena-emerald">Cash Prize</p>
              <div className="mt-1 flex items-baseline gap-0.5">
                <span className="text-[20px] font-black leading-none text-arena-emerald" style={displayFont}>$</span>
                <span className="text-[48px] font-black leading-none text-arena-ink tabular-nums" style={displayFont}>150</span>
              </div>
              <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-arena-emerald">Real Money</p>
            </div>
            <div className="bg-arena-amber p-3 text-black">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-black/80">Rings Pot</p>
              <div className="mt-1 flex items-center gap-1.5">
                <RingsCoin size={22} className="text-black" />
                <span className="text-[48px] font-black leading-none text-black tabular-nums" style={displayFont}>1M</span>
              </div>
              <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-black/80">Top 50 Split</p>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 space-y-4 bg-black">
        <section className="-mt-1 rounded-lg bg-[#0d0d0d] p-3 shadow-[0_18px_38px_rgba(0,0,0,0.55),inset_0_1px_0_hsl(var(--arena-line)/0.18)]">
          <div className="flex items-center gap-3">
            <img
              src={fixMySoulCover}
              alt="Fix My Soul cover"
              className="h-14 w-14 shrink-0 rounded-md object-cover shadow-[0_8px_18px_hsl(var(--arena-bg)/0.5),0_0_0_1px_hsl(var(--arena-line)/0.55)]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-arena-muted">Official Sound</p>
              <p className="mt-0.5 text-[20px] font-black uppercase leading-none text-arena-ink" style={displayFont}>Fix My Soul</p>
            </div>
            {event.materials_url && (
              <a
                href={event.materials_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-[10px] font-black uppercase tracking-[0.16em] text-primary-foreground shadow-[0_10px_24px_hsl(var(--arena-bg)/0.35)] active:scale-95 transition"
              >
                Use <ExternalLink size={12} />
              </a>
            )}
          </div>
        </section>

        <section className="rounded-lg bg-arena-panel p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.28)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-black uppercase leading-none text-arena-ink" style={displayFont}>Edit Showcase</h2>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-arena-muted">Inspo canvas + ranked drops</p>
            </div>
            {isShowcaseAdmin && (
              <button
                onClick={() => setShowShowcaseUpload(true)}
                className="rounded-lg bg-arena-emerald px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary shadow-[0_10px_24px_hsl(var(--arena-emerald)/0.28)] active:scale-95 transition"
              >
                Upload
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {featuredEdits.length === 0 ? (
              <>
                <EmptyDrop index={1} />
                <EmptyDrop index={2} />
                <EmptyDrop index={3} />
              </>
            ) : (
              featuredEdits.map((edit) => <ShowcaseDrop key={edit.id} edit={edit} />)
            )}
          </div>
        </section>

        {isLightYagami && (
          <section className="rounded-lg bg-arena-panel p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.26)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[24px] font-black uppercase leading-none text-arena-ink" style={displayFont}>Rewards</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-arena-amber"><RingsCoin size={12} /> 1,000,000 Rings</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <PrizePill icon={<Crown size={14} />} title="1st Best Edit" cash="$90" rings="120K" tone="gold" />
              <PrizePill icon={<Medal size={14} />} title="2nd Most Viral" cash="$60" rings="100K" />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
              {["1–5", "6–15", "16–30", "31–50"].map((range, index) => (
                <div key={range} className="rounded bg-arena-strong px-1.5 py-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-arena-muted">Rank {range}</p>
                  <p className="mt-1 text-[14px] font-black text-arena-amber" style={displayFont}>{["400K", "300K", "200K", "100K"][index]}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {isOpenArena && rounds.length > 0 && (
          <section className="rounded-lg bg-arena-panel p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.26)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[24px] font-black uppercase leading-none text-arena-ink" style={displayFont}>Round Flow</h2>
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-arena-muted">
                {activeRound ? `R${activeRound.round_number} Live` : `${rounds.length} Rounds`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {rounds.map((round) => {
                const userStatus = userRoundStatuses.find((s) => s.round_number === round.round_number);
                return (
                  <div key={round.round_number} className={`relative rounded-lg bg-arena-strong p-2 ${round.status === "active" ? "shadow-[0_0_0_1px_hsl(var(--arena-emerald))]" : ""}`}>
                    <p className="text-[20px] font-black leading-none" style={displayFont}>R{round.round_number}</p>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-arena-muted">{round.status === "active" ? "Live" : round.status === "completed" ? "Done" : "Soon"}</p>
                    {userStatus?.status === "advanced" && <CheckCircle2 size={12} className="absolute right-2 top-2 text-arena-emerald" />}
                    {userStatus?.status === "eliminated" && <XCircle size={12} className="absolute right-2 top-2 text-arena-red" />}
                  </div>
                );
              })}
            </div>
            {activeRound && (
              <div className="mt-3 rounded-lg bg-arena-strong p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge className="bg-arena-emerald text-primary text-[10px]">{activeRound.round_type.toUpperCase()}</Badge>
                  <div className="flex items-center gap-1 text-[11px] font-black text-arena-amber"><GateIcon size={12} /> {activeRound.index_reward} INDEX</div>
                </div>
                {activeRound.round_type !== "open" && (
                  <p className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-arena-muted">
                    <Target size={13} className="text-arena-red" />
                    {activeRound.round_type === "elimination"
                      ? activeRound.advancement_type === "top_x"
                        ? `Top ${activeRound.advancement_value} editors advance`
                        : `Top ${activeRound.advancement_value}% advance`
                      : `QOI ≥ ${activeRound.threshold_qoi} to advance`}
                  </p>
                )}
                {activeRound.ends_at ? <div className="mt-2"><CountdownTimer endDate={activeRound.ends_at} label="Round Ends" expiredLabel="Awaiting results..." /></div> : null}
              </div>
            )}
          </section>
        )}

        {event.rules && event.rules.length > 0 && (
          <section className="rounded-lg bg-arena-panel p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.24)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[24px] font-black uppercase leading-none text-arena-ink" style={displayFont}>Rules</h2>
              <Swords size={16} className="text-arena-red" />
            </div>
            <ol className="space-y-1.5">
              {event.rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 rounded bg-arena-strong px-3 py-2">
                  <span className="mt-0.5 text-[12px] font-black tabular-nums text-arena-amber" style={displayFont}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[12px] font-semibold leading-snug text-arena-ink/90">{forceTikTokRule(rule)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {isOpenArena && rounds.length > 0 && isLive && (
          <section className="rounded-lg bg-arena-panel p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.24)]">
            <h2 className="mb-3 text-[24px] font-black uppercase leading-none text-arena-ink" style={displayFont}>Round Rankings</h2>
            <OpenArenaRoundLeaderboard
              eventId={event.id}
              rounds={rounds}
              showEliminated={(event as any).show_eliminated ?? true}
              currentUserId={user?.id}
            />
          </section>
        )}

        <section ref={ladderRef} className="rounded-lg bg-arena-panel p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.24)] scroll-mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-black uppercase leading-none text-arena-ink" style={displayFont}>Full Ladder</h2>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-arena-muted">Scroll stays inside this event</p>
            </div>
            <button onClick={scrollToLadder} className="rounded-lg bg-arena-strong px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-arena-ink active:scale-95 transition">
              Expand
            </button>
          </div>

          {rankings.length === 0 ? (
            <div className="rounded-lg bg-arena-strong px-4 py-8 text-center">
              <Flame size={26} className="mx-auto mb-2 text-arena-red" />
              <p className="text-[13px] font-black text-arena-ink">First ranked edit takes the board.</p>
              <p className="mt-1 text-[11px] font-semibold text-arena-muted">Upload a TikTok edit and lock your spot.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {ladderRows.map((r, index) => <LadderRow key={r.id} row={r} rank={r.final_rank || index + 1} />)}
            </div>
          )}

          {rankings.length > ladderLimit && (
            <button
              onClick={() => setLadderLimit((current) => current + 12)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-arena-strong py-3 text-[10px] font-black uppercase tracking-[0.18em] text-arena-ink active:scale-[0.99] transition"
            >
              Show More <ChevronDown size={13} />
            </button>
          )}
        </section>

        {isClosed && (
          <section className="rounded-lg bg-arena-panel p-4 text-center shadow-[0_18px_38px_hsl(var(--arena-bg)/0.24)]">
            <Trophy size={22} className="mx-auto mb-2 text-arena-amber" />
            <p className="text-sm font-bold text-arena-ink">This event has concluded. Rankings are locked.</p>
          </section>
        )}

        {event.status === "pending" && (
          <section className="rounded-lg bg-arena-panel p-4 text-center shadow-[0_18px_38px_hsl(var(--arena-bg)/0.24)]">
            <Clock size={22} className="mx-auto mb-2 text-arena-muted" />
            <p className="text-sm font-bold text-arena-muted">Submissions open when the event goes live.</p>
          </section>
        )}

        {event.description && <p className="px-1 text-[12px] leading-relaxed text-arena-muted whitespace-pre-wrap">{event.description}</p>}

        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.13em] text-arena-muted">
          Submit as many edits as you want — only your highest QOI score counts. TikTok links only.
        </p>
      </main>

      {isLive && !(isOpenArena && advancementStatus === "eliminated") && (
        <div className="fixed bottom-0 inset-x-0 z-50 px-3 pt-3 pb-[max(env(safe-area-inset-bottom,0px),10px)] bg-[linear-gradient(180deg,transparent,hsl(var(--arena-bg)/0.94)_24%,hsl(var(--arena-bg))_100%)]">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full relative overflow-hidden rounded-lg py-3.5 bg-arena-emerald text-primary font-black text-[13px] uppercase tracking-[0.22em] active:scale-[0.99] transition-transform shadow-[0_0_34px_hsl(var(--arena-emerald)/0.34),0_-2px_0_hsl(var(--primary)/0.24)_inset]"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/35 to-transparent animate-shimmer" />
            <span className="relative inline-flex items-center gap-2">
              <Send size={14} strokeWidth={3} />
              {isOpenArena && activeRound ? `Submit · Round ${activeRound.round_number}` : "Enter Event"}
            </span>
          </button>
        </div>
      )}

      {isLive && isOpenArena && advancementStatus === "eliminated" && (
        <div className="fixed bottom-0 inset-x-0 z-50 px-3 pt-2 pb-[max(env(safe-area-inset-bottom,0px),8px)] bg-[linear-gradient(180deg,transparent,hsl(var(--arena-bg)))]">
          <div className="w-full text-center py-3.5 rounded-lg bg-arena-panel text-arena-muted text-[12px] font-bold shadow-[0_12px_30px_hsl(var(--arena-bg)/0.36)]">
            Eliminated in a previous round
          </div>
        </div>
      )}

      <SubmissionModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        eventId={event.id}
        eventTitle={event.title}
        roundNumber={isOpenArena ? activeRound?.round_number : undefined}
        isShowcase={false}
      />

      <ShowcaseUploadModal
        isOpen={showShowcaseUpload}
        onClose={() => setShowShowcaseUpload(false)}
        eventId={event.id}
        eventTitle={event.title}
        roundNumber={isOpenArena ? activeRound?.round_number : undefined}
      />

      <OpenArenaGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <EventChatSheet
        open={showChat}
        onClose={() => setShowChat(false)}
        eventId={event.id}
        eventTitle={event.title}
      />
    </div>
  );
}

function MetricTile({ label, value, accent = "ink" }: { label: string; value: number | string; accent?: "ink" | "emerald" }) {
  return (
    <div className="rounded-lg bg-arena-panel/90 p-3 shadow-[0_10px_24px_hsl(var(--arena-bg)/0.32)]">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-arena-muted">{label}</p>
      <p className={`mt-1 text-[28px] font-black leading-none tabular-nums ${accent === "emerald" ? "text-arena-emerald" : "text-arena-ink"}`} style={displayFont}>
        {value}
      </p>
    </div>
  );
}

function BigCountdown({ endDate }: { endDate: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(endDate).getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  const urgent = diff > 0 && diff < 60 * 60 * 1000;
  const tone = diff === 0 ? "text-arena-red" : urgent ? "text-arena-red" : "text-arena-ink";
  const Cell = ({ v, l }: { v: string; l: string }) => (
    <div className="flex-1 border border-arena-line/40 bg-[#0a0a0a] py-2 text-center">
      <p className={`text-[40px] leading-none font-black tabular-nums ${tone} ${urgent ? "animate-pulse" : ""}`} style={displayFont}>{v}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-arena-muted">{l}</p>
    </div>
  );
  return (
    <div className="mt-2 flex items-stretch gap-1">
      {d > 0 && <Cell v={pad(d)} l="Days" />}
      <Cell v={pad(h)} l="Hrs" />
      <Cell v={pad(m)} l="Min" />
      <Cell v={pad(s)} l="Sec" />
    </div>
  );
}

function InspoTile({ poster, label, crop = "50% 22%" }: { poster: string; label: string; crop?: string }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-arena-strong shadow-[0_0_0_1px_hsl(var(--arena-line)/0.25)]">
      <img src={poster} alt={`${label} inspiration`} className="h-full w-full object-cover" style={{ objectPosition: crop }} loading="lazy" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,hsl(var(--arena-bg)/0.82)_100%)]" />
      <span className="absolute bottom-1.5 left-1.5 rounded bg-arena-bg/80 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-arena-ink">{label}</span>
    </div>
  );
}

function ShowcaseDrop({ edit }: { edit: any }) {
  const thumb = edit.thumbnail_url;
  return (
    <a href={edit.submission_url} target="_blank" rel="noopener noreferrer" className="relative aspect-[3/4] overflow-hidden rounded-lg bg-arena-strong shadow-[0_0_0_1px_hsl(var(--arena-line)/0.24)] active:scale-[0.98] transition">
      {thumb ? <img src={thumb} alt={edit.custom_title || "Submitted edit"} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full bg-[linear-gradient(135deg,hsl(var(--arena-panel-strong)),hsl(var(--arena-bg)))]" />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--arena-bg)/0.08),hsl(var(--arena-bg)/0.8))]" />
      <div className="absolute left-1.5 top-1.5 rounded bg-arena-panel/80 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-arena-ink">INSPO</div>
      <Play size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary drop-shadow" fill="currentColor" />
      {edit.custom_title && (
        <p className="absolute inset-x-1.5 bottom-1.5 truncate text-[9px] font-black text-primary">{edit.custom_title}</p>
      )}
    </a>
  );
}

function EmptyDrop({ index }: { index: number }) {
  return (
    <div className="aspect-[3/4] rounded-lg bg-arena-strong p-2 shadow-[0_0_0_1px_hsl(var(--arena-line)/0.24)] flex flex-col justify-between">
      <span className="text-[9px] font-black text-arena-muted" style={displayFont}>SLOT {index}</span>
      <div>
        <Zap size={16} className="mb-1 text-arena-amber" />
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-arena-muted">Awaiting drop</p>
      </div>
    </div>
  );
}

function PrizePill({ icon, title, cash, rings, tone }: { icon: ReactNode; title: string; cash: string; rings: string; tone?: "gold" }) {
  return (
    <div className="rounded-lg bg-arena-strong p-3">
      <div className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded ${tone === "gold" ? "bg-arena-amber text-primary-foreground" : "bg-arena-panel text-arena-ink"}`}>{icon}</div>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-arena-muted">{title}</p>
      <p className="mt-1 text-[25px] font-black leading-none text-arena-ink" style={displayFont}>{cash}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-arena-amber"><RingsCoin size={11} /> {rings}</p>
    </div>
  );
}

function LadderRow({ row, rank }: { row: any; rank: number }) {
  const qoi = row.qoi_score || 0;
  const grade = qoi >= 90 ? "S" : qoi >= 80 ? "A" : qoi >= 70 ? "B" : qoi >= 60 ? "C" : "—";
  const rankTone = rank === 1 ? "text-arena-amber" : rank === 2 ? "text-arena-ink" : rank === 3 ? "text-arena-red" : "text-arena-muted";

  return (
    <a href={row.submission_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg bg-arena-strong px-3 py-2.5 active:scale-[0.99] transition">
      <div className={`w-9 text-center text-[24px] font-black leading-none tabular-nums ${rankTone}`} style={displayFont}>#{rank}</div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13px] font-black text-arena-ink">{row.profile?.username || row.author_username || "Unknown"}</p>
        <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-arena-muted">TikTok · {row.view_count ? `${row.view_count.toLocaleString()} views` : "Submitted"}</p>
      </div>
      <div className="text-right">
        <p className="text-[22px] font-black leading-none tabular-nums text-arena-ink" style={displayFont}>{qoi ? qoi.toFixed(1) : "—"}</p>
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-arena-muted">QOI</p>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded bg-arena-panel text-[17px] font-black text-arena-amber" style={displayFont}>{grade}</div>
    </a>
  );
}

function forceTikTokRule(rule: string) {
  if (/instagram|youtube|platform|submit/i.test(rule)) return "Submit a published TikTok edit link only.";
  return rule;
}
