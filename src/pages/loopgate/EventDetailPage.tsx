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
  Share2,
  ListOrdered,
  Swords,
  Target,
  Trophy,
  X,
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
import EventSharePoster from "@/components/loopgate/EventSharePoster";
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
  const [showShare, setShowShare] = useState(false);
  const [ladderLimit, setLadderLimit] = useState(10);
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
  const formatHeroDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return `${d.getDate().toString().padStart(2, "0")} ${d.toLocaleString("en-US", { month: "long" }).toUpperCase()}`;
  };
  const heroStart = formatHeroDate((event as any).start_date);
  const heroEnd = formatHeroDate((event as any).end_date);
  const heroDateRange = heroEnd
    ? heroStart && heroStart !== heroEnd
      ? `${heroStart} — ${heroEnd}`
      : heroEnd
    : null;
  const titleWords = event.title.trim().split(/\s+/);
  const titleHead = titleWords.slice(0, -1).join(" ");
  const titleTail = titleWords[titleWords.length - 1];
  // Edit Showcase = ONLY admin-uploaded inspo drops (is_showcase=true). Never ranked submissions.
  const featuredEdits = rankings.filter((r) => r.submission_url && (r as any).is_showcase).slice(0, 3);
  const emptySlotCount = Math.max(0, 3 - featuredEdits.length);
  const realLadder = rankings.filter((r) => !(r as any).is_showcase);
  const paddedLadder: any[] = [
    ...realLadder,
    ...Array.from({ length: Math.max(0, 50 - realLadder.length) }, (_, i) => ({
      id: `empty-${i}`,
      __empty: true,
    })),
  ].slice(0, 50);
  const ladderRows = paddedLadder.slice(0, ladderLimit);
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
    setLadderLimit(50);
  };

  return (
    <div className="min-h-screen pb-28 bg-black text-arena-ink" style={bodyFont}>
      {/* CINEMATIC HERO — EWC × Fortnite */}
      <div className="relative overflow-hidden bg-black min-h-[78vh]">
        <img
          src={displayPoster || lightYagamiPoster}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{ objectPosition: isLightYagami ? "50% 22%" : "50% 35%" }}
        />
        {/* cinematic vignette: clear up top, deep black down low */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.15)_28%,rgba(0,0,0,0.45)_62%,rgba(0,0,0,0.95)_92%,#000_100%)]" />
        {/* side darken for legibility */}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,rgba(0,0,0,0.55),transparent)]" />
        {/* amber rim flare like EWC stage lights */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-arena-amber/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/3 -left-32 w-96 h-96 rounded-full bg-arena-red/20 blur-3xl" />

        <div className="relative flex flex-col min-h-[78vh] px-4 pt-[max(env(safe-area-inset-top),14px)] pb-5">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/arena"
              className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center active:scale-95 transition"
              aria-label="Back to arena"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-arena-red px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-[0_0_18px_hsl(var(--arena-red)/0.6)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Live
                </span>
              )}
              {isOpenArena && <OpenArenaInfoButton onClick={() => setShowGuide(true)} />}
              <button
                onClick={scrollToLadder}
                aria-label="Jump to leaderboard"
                className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur-md ring-1 ring-arena-amber/40 flex items-center justify-center active:scale-95 transition text-arena-amber"
              >
                <ListOrdered size={17} />
              </button>
              <button
                onClick={() => setShowShare(true)}
                aria-label="Share competition"
                className="w-9 h-9 rounded-lg bg-black/60 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center active:scale-95 transition"
              >
                <Share2 size={17} />
              </button>
              <button
                onClick={() => setShowChat(true)}
                aria-label="Open event chat"
                className="relative w-9 h-9 rounded-lg bg-black/60 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center active:scale-95 transition"
              >
                <MessageCircle size={18} />
                {chatUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-black animate-pulse">
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Spacer pushes title block toward bottom of hero */}
          <div className="flex-1 min-h-[10vh]" />

          {/* Date pill — EWC style */}
          {heroDateRange && (
            <div className="inline-flex w-max items-center gap-2 rounded-md bg-black/55 backdrop-blur-md ring-1 ring-white/15 px-3 py-1.5 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-arena-amber shadow-[0_0_8px_hsl(var(--arena-amber))]" />
              <span className="text-[11px] font-black uppercase tracking-[0.28em] text-white">{heroDateRange}</span>
            </div>
          )}

          {/* Slanted title — tighter so prize banner sits in view */}
          <h1
            className="font-black uppercase leading-[0.82] text-white drop-shadow-[0_6px_22px_rgba(0,0,0,0.85)]"
            style={{ ...displayFont, fontSize: "clamp(40px, 11vw, 72px)", letterSpacing: "-0.01em", transform: "skewX(-6deg)" }}
          >
            {titleHead && <span className="block">{titleHead}</span>}
            <span
              className="block bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, #ffd76a 0%, #f5a623 45%, #b8731a 100%)",
                WebkitTextStroke: "1px rgba(0,0,0,0.25)",
              }}
            >
              {titleTail}
            </span>
          </h1>

          {event.subtitle && (
            <p className="mt-2 max-w-[88%] text-[10px] font-black uppercase tracking-[0.18em] leading-[1.4] text-white/80">
              {event.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* MASSIVE PRIZE BANNER — first thing after title, impossible to miss */}
      <div className="relative -mt-2 bg-black px-3 pt-3 pb-1">
        <p className="mb-2 text-center text-[9px] font-black uppercase tracking-[0.42em] text-white/40" style={displayFont}>
          Prize Pool
        </p>
        <div
          className="relative flex items-stretch h-[104px]"
          style={{ filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.6))" }}
        >
          {/* CASH slab — bright emerald gradient, black text */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden"
            style={{
              clipPath: "polygon(0 0, 100% 0, calc(100% - 18px) 100%, 0 100%)",
              background: "linear-gradient(180deg, #ffffff 0%, #f4fff8 100%)",
              boxShadow: "inset 0 0 0 2px rgba(16,185,129,0.35), inset 0 -6px 0 rgba(16,185,129,0.18)",
            }}
          >
            <div className="flex items-baseline gap-1 px-3 text-black" style={displayFont}>
              <span className="text-[40px] font-black leading-none" style={{ color: "#00E676", textShadow: "0 0 18px rgba(0,230,118,0.55)" }}>$</span>
              <span className="text-[72px] font-black leading-none tabular-nums tracking-[-0.02em]">150</span>
              <span className="ml-2 text-[11px] font-black uppercase tracking-[0.22em] text-black/70 self-center leading-[1.05]">Cash<br/>Real $</span>
            </div>
          </div>
          {/* RINGS slab — bright gold gradient */}
          <div
            className="relative -ml-4 flex-1 flex items-center justify-center overflow-hidden"
            style={{
              clipPath: "polygon(18px 0, 100% 0, 100% 100%, 0 100%)",
              background: "linear-gradient(180deg, #FFE14A 0%, #FFC107 55%, #F59E0B 100%)",
              boxShadow: "0 0 38px rgba(255,193,7,0.5), inset 0 0 0 2px rgba(255,255,255,0.35)",
            }}
          >
            <div className="flex items-center gap-2 pl-5 pr-3 text-black" style={displayFont}>
              <RingsCoin size={32} className="text-black" />
              <span className="text-[72px] font-black leading-none tabular-nums tracking-[-0.02em]">1M</span>
              <span className="ml-1 text-[11px] font-black uppercase tracking-[0.22em] text-black/80 self-center leading-[1.05]">Rings<br/>Top 50</span>
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] font-black uppercase tracking-[0.28em] text-white/55" style={displayFont}>
          $150 <span className="text-emerald-400">cash</span> · top 5 · 1M <span className="text-amber-400">rings</span> · top 50
        </p>

        {/* COUNTDOWN — under prize banner */}
        {(event as any).end_date && (
          <div className="mt-3">
            <GlassyCountdown endDate={(event as any).end_date} />
          </div>
        )}
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

        <section className="rounded-lg bg-black ring-1 ring-white/[0.06] p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.28)]">
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
            {featuredEdits.map((edit, i) => (
              <RankedDrop
                key={edit.id}
                edit={edit}
                rank={(edit as any).is_showcase ? null : (edit.final_rank || i + 1)}
              />
            ))}
            {Array.from({ length: emptySlotCount }).map((_, i) => (
              <EmptyDrop key={`empty-${i}`} index={featuredEdits.length + i + 1} />
            ))}
          </div>
        </section>

        {isLightYagami && (
          <section className="relative overflow-hidden rounded-lg bg-[#06070a] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]">
            {/* EWC diagonal stripe backdrop */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0 1px, transparent 1px 14px)" }} />
            <div className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-arena-amber/25 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-arena-emerald/15 blur-[80px]" />

            <div className="relative mb-4 flex items-end justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.42em] text-white/40">Prize Pool</p>
                <h2 className="mt-0.5 text-[30px] font-black uppercase leading-none text-white" style={{ ...displayFont, transform: "skewX(-6deg)" }}>Rewards</h2>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-sm bg-black/70 px-2.5 py-1.5 ring-1 ring-arena-amber/45">
                <RingsCoin size={13} />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-arena-amber" style={displayFont}>1,000,000 Rings</span>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-2.5">
              <PrizeSlab rank="01" title="Best Edit" cash="$90" rings="120K" tone="gold" />
              <PrizeSlab rank="02" title="Most Viral" cash="$60" rings="100K" />
            </div>

            <div className="relative mt-2.5 grid grid-cols-4 gap-1.5 text-center">
              {["1–5", "6–15", "16–30", "31–50"].map((range, index) => (
                <div key={range} className="relative overflow-hidden bg-black/55 px-1.5 py-2 ring-1 ring-white/[0.06]" style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}>
                  <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/45">Rank {range}</p>
                  <p className="mt-1 text-[15px] font-black text-arena-amber tabular-nums" style={displayFont}>{["400K", "300K", "200K", "100K"][index]}</p>
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
          <section className="rounded-lg bg-black ring-1 ring-white/[0.06] p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.24)]">
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

        <section ref={ladderRef} className="rounded-lg bg-black ring-1 ring-white/[0.06] p-3 shadow-[0_18px_38px_hsl(var(--arena-bg)/0.24)] scroll-mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[24px] font-black uppercase leading-none text-arena-ink" style={displayFont}>Full Ladder</h2>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-arena-muted">Scroll stays inside this event</p>
            </div>
            <button onClick={() => setLadderLimit(ladderLimit >= 50 ? 10 : 50)} className="rounded-lg bg-arena-strong px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-arena-ink active:scale-95 transition">
              {ladderLimit >= 50 ? "Collapse" : "Top 50"}
            </button>
          </div>

          <div className="space-y-1.5">
            {ladderRows.map((r, index) => {
              const rank = (r as any).final_rank || index + 1;
              return <LadderRow key={r.id} row={r} rank={rank} prize={getPrizeForRank(rank)} />;
            })}
          </div>

          {ladderLimit < 50 && (
            <button
              onClick={() => setLadderLimit((current) => Math.min(50, current + 10))}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-arena-strong py-3 text-[10px] font-black uppercase tracking-[0.18em] text-arena-ink active:scale-[0.99] transition"
            >
              Show More Prizes <ChevronDown size={13} />
            </button>
          )}

          <p className="mt-3 text-center text-[9px] font-black uppercase tracking-[0.22em] text-white/35">
            $150 cash split top 5 · 1,000,000 index split top 50
          </p>
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

      <EventSharePoster
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={event.title}
        posterUrl={displayPoster || lightYagamiPoster}
        songTitle={isLightYagami ? "Fix My Soul" : undefined}
        themeLabel={isLightYagami ? "Death Note Theme" : undefined}
        endDate={(event as any).end_date}
        shareUrl={`${window.location.origin}/event/${event.slug || event.id}`}
        cashPrize="$150"
        ringsPrize="1M"
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

function GlassyCountdown({ endDate }: { endDate: string }) {
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
  const Cell = ({ v, l }: { v: string; l: string }) => (
    <div className="flex-1 flex flex-col items-center justify-center py-2.5 px-1">
      <p
        className={`text-[34px] leading-none font-black tabular-nums text-white ${urgent ? "animate-pulse text-arena-amber" : ""}`}
        style={displayFont}
      >
        {v}
      </p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.32em] text-white/55">{l}</p>
    </div>
  );
  const Colon = () => (
    <span className="self-center pb-3 text-[26px] font-black text-white/35 select-none" style={displayFont}>:</span>
  );
  return (
    <div className="inline-flex w-full max-w-md items-stretch rounded-2xl bg-black/55 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.55)] px-2">
      <Cell v={pad(d)} l="Days" />
      <Colon />
      <Cell v={pad(h)} l="Hours" />
      <Colon />
      <Cell v={pad(m)} l="Minutes" />
      <Colon />
      <Cell v={pad(s)} l="Seconds" />
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
  const [open, setOpen] = useState(false);
  const url: string = edit.submission_url;
  const isVideoFile = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || "");
  const isExternal = /tiktok\.com|instagram\.com|youtube\.com|youtu\.be/i.test(url || "");
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isExternal && !isVideoFile) {
            window.open(url, "_blank", "noopener,noreferrer");
          } else {
            setOpen(true);
          }
        }}
        className="relative aspect-[3/4] overflow-hidden rounded-lg bg-arena-strong shadow-[0_0_0_1px_hsl(var(--arena-line)/0.24)] active:scale-[0.98] transition text-left"
      >
        {thumb ? <img src={thumb} alt={edit.custom_title || "Submitted edit"} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full bg-[linear-gradient(135deg,hsl(var(--arena-panel-strong)),hsl(var(--arena-bg)))]" />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--arena-bg)/0.08),hsl(var(--arena-bg)/0.8))]" />
        <div className="absolute left-1.5 top-1.5 rounded bg-arena-panel/80 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-arena-ink">INSPO</div>
        <Play size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary drop-shadow" fill="currentColor" />
        {edit.custom_title && (
          <p className="absolute inset-x-1.5 bottom-1.5 truncate text-[9px] font-black text-primary">{edit.custom_title}</p>
        )}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="absolute right-4 top-[max(env(safe-area-inset-top,0px),16px)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur"
            aria-label="Close inspo"
          >
            <X size={18} className="text-white" />
          </button>
          <video
            src={url}
            poster={thumb || undefined}
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-auto max-w-full rounded-lg bg-black"
          />
        </div>
      )}
    </>
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

function RankedDrop({ edit, rank }: { edit: any; rank: number | null }) {
  const thumb = edit.thumbnail_url;
  const [open, setOpen] = useState(false);
  const url: string = edit.submission_url;
  const isVideoFile = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || "");
  const isExternal = /tiktok\.com|instagram\.com|youtube\.com|youtu\.be/i.test(url || "");
  const qoi = edit.qoi_score;
  const views = edit.view_count;
  const author = edit.author_username;
  const rankTone =
    rank === 1 ? "bg-arena-amber text-black"
    : rank === 2 ? "bg-white text-black"
    : rank === 3 ? "bg-arena-red text-white"
    : "bg-arena-panel text-arena-ink";
  const formatViews = (n?: number | null) => {
    if (!n || n <= 0) return null;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isExternal && !isVideoFile) window.open(url, "_blank", "noopener,noreferrer");
          else setOpen(true);
        }}
        className="relative aspect-[3/4] overflow-hidden rounded-lg bg-arena-strong shadow-[0_0_0_1px_hsl(var(--arena-line)/0.24)] active:scale-[0.98] transition text-left"
      >
        {thumb ? (
          <img src={thumb} alt={author || "Top ranked edit"} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-[linear-gradient(135deg,hsl(var(--arena-panel-strong)),hsl(var(--arena-bg)))]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_38%,rgba(0,0,0,0.85)_100%)]" />
        {rank !== null && (
          <div className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${rankTone}`} style={displayFont}>
            #{rank}
          </div>
        )}
        {(edit as any).is_showcase && (
          <div className="absolute left-1.5 top-1.5 rounded bg-arena-panel/85 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-arena-ink">INSPO</div>
        )}
        {qoi != null && (
          <div className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-black text-arena-amber tabular-nums" style={displayFont}>
            {Number(qoi).toFixed(0)}
          </div>
        )}
        <Play size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary drop-shadow" fill="currentColor" />
        <div className="absolute inset-x-1.5 bottom-1.5 space-y-0.5">
          {author && (
            <p className="truncate text-[10px] font-black leading-tight text-white">@{author}</p>
          )}
          {formatViews(views) && (
            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/65">{formatViews(views)} views</p>
          )}
        </div>
      </button>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4" onClick={() => setOpen(false)}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="absolute right-4 top-[max(env(safe-area-inset-top,0px),16px)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur"
            aria-label="Close edit"
          >
            <X size={18} className="text-white" />
          </button>
          <video src={url} poster={thumb || undefined} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-auto max-w-full rounded-lg bg-black" />
        </div>
      )}
    </>
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

function PrizeSlab({ rank, title, cash, rings, tone }: { rank: string; title: string; cash: string; rings: string; tone?: "gold" }) {
  const isGold = tone === "gold";
  return (
    <div
      className={`relative overflow-hidden p-3 pl-4 ring-1 ${isGold ? "ring-arena-amber/55" : "ring-white/[0.08]"}`}
      style={{
        clipPath: "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)",
        background: isGold
          ? "linear-gradient(135deg, #1a1305 0%, #0a0a0a 75%)"
          : "linear-gradient(135deg, #0d0e12 0%, #050608 80%)",
      }}
    >
      {isGold && <span className="absolute inset-y-0 left-0 w-[3px] bg-arena-amber shadow-[0_0_18px_hsl(var(--arena-amber))]" />}
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-black tabular-nums tracking-[0.1em] ${isGold ? "text-arena-amber" : "text-white/45"}`} style={displayFont}>{rank}</span>
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/60">{title}</span>
      </div>
      <p className={`mt-2 text-[34px] font-black leading-none tabular-nums ${isGold ? "text-white drop-shadow-[0_0_18px_rgba(255,184,28,0.35)]" : "text-white"}`} style={{ ...displayFont, transform: "skewX(-5deg)" }}>{cash}</p>
      <div className="mt-2 inline-flex items-center gap-1 rounded-sm bg-black/55 px-1.5 py-0.5 ring-1 ring-arena-amber/30">
        <RingsCoin size={11} />
        <span className="text-[10px] font-black tabular-nums text-arena-amber" style={displayFont}>{rings}</span>
      </div>
    </div>
  );
}

function getPrizeForRank(rank: number): { cash?: string; index: string; tone: "gold" | "silver" | "bronze" | "blue" | "muted" } {
  if (rank === 1) return { cash: "$60", index: "250K", tone: "gold" };
  if (rank === 2) return { cash: "$40", index: "175K", tone: "silver" };
  if (rank === 3) return { cash: "$25", index: "100K", tone: "bronze" };
  if (rank === 4) return { cash: "$15", index: "75K", tone: "blue" };
  if (rank === 5) return { cash: "$10", index: "50K", tone: "blue" };
  if (rank <= 10) return { index: "35K", tone: "blue" };
  if (rank <= 25) return { index: "15K", tone: "muted" };
  return { index: "5K", tone: "muted" };
}

function LadderRow({ row, rank, prize }: { row: any; rank: number; prize: ReturnType<typeof getPrizeForRank> }) {
  const isEmpty = !!row.__empty;
  const qoi = row.qoi_score || 0;
  const grade = qoi >= 90 ? "S" : qoi >= 80 ? "A" : qoi >= 70 ? "B" : qoi >= 60 ? "C" : "—";
  const isTop1 = rank === 1;
  const isTop3 = rank <= 3;
  const rankTone = isTop1 ? "text-arena-amber" : rank === 2 ? "text-white" : rank === 3 ? "text-arena-red" : "text-white/35";
  const accent = isTop1 ? "hsl(var(--arena-amber))" : rank === 2 ? "#cfd3dc" : rank === 3 ? "hsl(var(--arena-red))" : "rgba(255,255,255,0.12)";
  const prizeColor =
    prize.tone === "gold" ? "text-arena-amber" :
    prize.tone === "silver" ? "text-white" :
    prize.tone === "bronze" ? "text-arena-red" :
    prize.tone === "blue" ? "text-sky-300" :
    "text-white/40";

  const Wrapper: any = isEmpty ? "div" : "a";
  const wrapperProps: any = isEmpty
    ? {}
    : { href: row.submission_url, target: "_blank", rel: "noopener noreferrer" };

  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative flex items-center gap-3 overflow-hidden bg-[#0a0b0f] pl-4 pr-3 py-2.5 ring-1 ring-white/[0.05] transition ${isEmpty ? "opacity-60" : "active:scale-[0.99]"}`}
      style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)" }}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: accent, boxShadow: isTop3 ? `0 0 16px ${accent}` : undefined }} />
      {isTop1 && <span className="pointer-events-none absolute -right-8 top-0 bottom-0 w-24 bg-gradient-to-l from-arena-amber/15 to-transparent" />}

      <div className={`w-11 text-center text-[26px] font-black leading-none tabular-nums ${rankTone}`} style={{ ...displayFont, transform: "skewX(-6deg)" }}>
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13px] font-black text-white">
          {isEmpty ? <span className="text-white/30">Open slot</span> : (row.profile?.username || row.author_username || "Unknown")}
        </p>
        <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
          {isEmpty ? "Claim this rank" : `TikTok · ${row.view_count ? `${row.view_count.toLocaleString()} views` : "Submitted"}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        {prize.cash && (
          <p className={`text-[20px] font-black leading-none tabular-nums ${prizeColor}`} style={{ ...displayFont, transform: "skewX(-5deg)" }}>
            {prize.cash}
          </p>
        )}
        <p className={`${prize.cash ? "mt-0.5" : ""} text-[12px] font-black tabular-nums ${prize.cash ? "text-white/70" : prizeColor}`} style={displayFont}>
          +{prize.index}
        </p>
        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/35">{prize.cash ? "cash · index" : "index"}</p>
      </div>
      <div
        className={`flex h-9 w-9 items-center justify-center text-[18px] font-black ${isTop3 ? "text-arena-amber" : "text-white/40"}`}
        style={{ ...displayFont, background: "#000", clipPath: "polygon(10% 0, 100% 0, 90% 100%, 0 100%)" }}
      >
        {isEmpty ? "—" : grade}
      </div>
    </Wrapper>
  );
}

function forceTikTokRule(rule: string) {
  if (/instagram|youtube|platform|submit/i.test(rule)) return "Submit a published TikTok edit link only.";
  return rule;
}
