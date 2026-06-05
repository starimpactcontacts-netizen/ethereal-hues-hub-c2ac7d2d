import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Loader2, Check, Sparkles, CalendarCheck, Gift, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import RingsCoin from "@/components/loopgate/RingsCoin";
import AuraUsername, { AURA_CFG, type AuraSlug } from "@/components/loopgate/AuraUsername";
import FoundingBadge from "@/components/loopgate/FoundingBadge";

// Loopgate signature font — bold Teko
const PIXEL = {
  fontFamily: "'Teko', 'Bebas Neue', sans-serif",
  letterSpacing: "0.08em",
  fontWeight: 700,
  textTransform: "uppercase" as const,
} as React.CSSProperties;

// Per-aura ambient preview backdrop — subtle so the aura text shines
const AURA_BG: Record<string, string> = {
  steve:     "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(125,181,68,0.22), transparent 70%)",
  hellfire:  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,80,0,0.25), transparent 70%)",
  sovereign: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,215,0,0.22), transparent 70%)",
};
const AURA_GLOW: Record<string, string> = {
  steve:     "0 0 40px rgba(125,181,68,0.45)",
  hellfire:  "0 0 50px rgba(255,80,0,0.55)",
  sovereign: "0 0 55px rgba(255,215,0,0.5)",
};

type TabKey = "cosmetics" | "daily";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "cosmetics", label: "COSMETICS",     icon: <Sparkles className="w-3.5 h-3.5" /> },
  { key: "daily",     label: "DAILY REWARDS", icon: <CalendarCheck className="w-3.5 h-3.5" /> },
];

interface ShopItem {
  id: string; name: string; description: string | null;
  category: string; price: number; rarity: string; is_active: boolean;
  is_limited?: boolean; available_until?: string | null;
}
interface OwnedMap { [itemId: string]: boolean }

// Clean modern font for product chrome (Discord-like)
const UI: React.CSSProperties = { fontFamily: "Inter, system-ui, sans-serif" };

export default function ShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("cosmetics");
  const [navOpen, setNavOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 768;
  });
  const [items, setItems] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<OwnedMap>({});
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [rings, setRings] = useState(0);
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [viewerName, setViewerName] = useState<string>("you");
  const [viewerAvatar, setViewerAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      const { data: shopData } = await supabase
        .from("shop_items").select("id, name, description, category, price, rarity, is_active, is_limited, available_until")
        .eq("is_active", true).in("category", ["aura", "badge"]).order("price", { ascending: true });
      if (shopData) setItems(shopData as ShopItem[]);
      if (user) {
        const { data: purchaseData } = await supabase.from("shop_purchases").select("item_id").eq("user_id", user.id);
        if (purchaseData) {
          const map: OwnedMap = {};
          purchaseData.forEach((p: any) => { map[p.item_id] = true; });
          setOwned(map);
        }
        const { data: profileData } = await supabase.from("profiles").select("rings").eq("id", user.id).single();
        if (profileData) setRings((profileData as any).rings ?? 0);
        const { data: meData } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();
        if (meData) {
          const meta: any = (user as any).user_metadata || {};
          setViewerName(meta.username || (meData as any).username || "you");
          setViewerAvatar((meData as any).avatar_url ?? null);
        }
      }
      setLoading(false);
    };
    fetchShop();
  }, [user]);

  const handleBuy = async (item: ShopItem) => {
    if (!user) { toast.error("Sign in to buy"); return; }
    if (owned[item.id]) { navigate("/inventory"); return; }
    if (rings < item.price) { toast.error("Not enough Rings"); return; }
    setBuying(item.id);
    const { error: deductErr } = await supabase.rpc("deduct_rings" as any, { p_user_id: user.id, p_amount: item.price });
    if (deductErr) {
      const { error: updateErr } = await supabase.from("profiles").update({ rings: rings - item.price } as any).eq("id", user.id);
      if (updateErr) { toast.error("Purchase failed"); setBuying(null); return; }
    }
    const { error: buyErr } = await supabase.from("shop_purchases").insert({ user_id: user.id, item_id: item.id });
    if (buyErr) { toast.error("Purchase failed"); }
    else { setOwned((o) => ({ ...o, [item.id]: true })); setRings((r) => r - item.price); toast.success(`${item.name} unlocked!`); }
    setBuying(null);
  };

  return (
    <div
      className="min-h-screen pb-28 relative"
      style={{
        backgroundColor: "#0A0A0A",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.032) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }}
    >
      {/* Radial depth pull — matches Hub */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,255,255,0.022) 0%, transparent 100%)',
        }}
      />
      {/* Top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-4"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "calc(env(safe-area-inset-top,0px) + 12px)",
          paddingBottom: 12,
        }}
      >
        <span style={{ ...PIXEL, fontSize: 24, color: "#fff" }}>
          SHOP
        </span>
        {user && (
          <div className="flex items-baseline px-2.5 py-1.5"
            style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)", ...PIXEL, fontSize: 20, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#3BCB6B" }}>$</span>
            <span style={{ color: "#fff" }}>R</span>
            <span className="ml-1 tabular-nums" style={{ color: "#fff" }}>{rings.toLocaleString()}</span>
          </div>
        )}
        <button onClick={() => navigate(-1)} aria-label="Close"
          className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white"
          style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative z-10 flex gap-2 px-3 pt-4">
        {/* Sidebar tabs — collapsible */}
        <aside
          className="flex flex-col gap-2 shrink-0 transition-[width] duration-200 ease-out"
          style={{ width: navOpen ? 132 : 40 }}
        >
          <button
            onClick={() => setNavOpen((v) => !v)}
            aria-label={navOpen ? "Collapse menu" : "Expand menu"}
            className="flex items-center justify-center h-8 text-zinc-400 hover:text-white transition-colors"
            style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {navOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-label={t.label}
                className={`flex items-center ${navOpen ? "gap-2 px-3 justify-start" : "justify-center px-0"} py-2.5 text-left transition-colors`}
                style={{
                  background: active ? "#171717" : "transparent",
                  border: active ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                  color: active ? "#fff" : "#8a8a8a",
                }}
              >
                {t.icon}
                {navOpen && (
                  <span style={{ ...PIXEL, fontSize: 16 }}>
                    {t.label === "DAILY REWARDS" ? "Daily" : "Cosmetics"}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
            </div>
          ) : tab === "cosmetics" ? (
            <CosmeticsTab
              items={items}
              owned={owned}
              rings={rings}
              buying={buying}
              onBuy={handleBuy}
              onPreview={(it) => setPreviewItem(it)}
              viewerName={viewerName}
              viewerAvatar={viewerAvatar}
            />
          ) : (
            <DailyRewardsTab />
          )}
        </main>
      </div>

      {previewItem && (
        previewItem.category === "badge" ? (
          <BadgePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
        ) : (
          <AuraPreviewModal
            item={previewItem}
            viewerName={viewerName}
            viewerAvatar={viewerAvatar}
            onClose={() => setPreviewItem(null)}
          />
        )
      )}
    </div>
  );
}

/* ────────────────── COSMETICS ────────────────── */
function CosmeticsTab({ items, owned, rings, buying, onBuy, onPreview, viewerName, viewerAvatar }: {
  items: ShopItem[]; owned: OwnedMap; rings: number; buying: string | null;
  onBuy: (item: ShopItem) => void; onPreview: (item: ShopItem) => void;
  viewerName: string; viewerAvatar: string | null;
}) {
  const auras = items.filter((i) => i.category === "aura");
  const badges = items.filter((i) => i.category === "badge");
  return (
    <div className="space-y-8">
      {badges.length > 0 && (
        <div className="space-y-5">
          <SectionHeader label="BADGES" newTag />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((item, i) => (
              <BadgeCard
                key={item.id}
                item={item}
                owned={!!owned[item.id]}
                buying={buying === item.id}
                onBuy={() => onBuy(item)}
                onPreview={() => onPreview(item)}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
      <div className="space-y-5">
      <SectionHeader label="NAME COLORS" />
      {auras.length === 0 ? (
        <div className="py-16 text-center" style={{ ...PIXEL, fontSize: 10, color: "#52525b" }}>NO ITEMS</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {auras.map((item, i) => (
            <NameColorCard
              key={item.id}
              item={item}
              owned={!!owned[item.id]}
              canAfford={rings >= item.price}
              buying={buying === item.id}
              onBuy={() => onBuy(item)}
              onPreview={() => onPreview(item)}
              index={i}
              viewerName={viewerName}
              viewerAvatar={viewerAvatar}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function NameColorCard({ item, owned, canAfford, buying, onBuy, onPreview, index, viewerName, viewerAvatar }: {
  item: ShopItem; owned: boolean; canAfford: boolean; buying: boolean;
  onBuy: () => void; onPreview: () => void; index: number;
  viewerName: string; viewerAvatar: string | null;
}) {
  const auraSlug = item.name.toLowerCase() as AuraSlug;
  const auraCfg = AURA_CFG[auraSlug];
  const bg = AURA_BG[auraSlug] || "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.08), transparent 70%)";
  const glow = AURA_GLOW[auraSlug];
  const isLimited = auraSlug === "sovereign";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
      className="relative flex flex-col overflow-hidden"
      style={{
        background: "#111114",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Live preview hero — a real chat block showing the name color in context */}
      <button
        onClick={onPreview}
        aria-label="Preview"
        className="relative w-full overflow-hidden"
        style={{
          background: "#0a0a0a",
          aspectRatio: "1/1",
          backgroundImage: bg,
        }}
      >
        <ChatBlockPreview name={viewerName} avatarUrl={viewerAvatar} aura={auraSlug} compact />
        {isLimited && !owned && (
          <div className="absolute top-2 left-2 px-2 py-0.5"
            style={{ ...UI, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,215,0,0.6)", fontSize: 10, fontWeight: 700, color: "#FFD060", letterSpacing: "0.1em" }}>
            LIMITED
          </div>
        )}
        {owned && (
          <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center"
            style={{ background: "#22c55e" }}>
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        )}
      </button>

      {/* Info + buy area (Discord-like) */}
      <div className="p-3 pt-2.5 flex flex-col gap-2">
        <div className="min-w-0">
          <div className="truncate" style={{ ...PIXEL, fontSize: 18, color: "#fff" }}>{item.name}</div>
          {!owned && (
            <div className="flex items-baseline mt-0.5" style={{ ...PIXEL, fontSize: 16, letterSpacing: "-0.03em" }}>
              <span style={{ color: "#3BCB6B" }}>$</span>
              <span style={{ color: "#fff" }}>R</span>
              <span className="ml-1 tabular-nums" style={{ color: "#fff" }}>{item.price.toLocaleString()}</span>
            </div>
          )}
        </div>
        <button
          onClick={onBuy}
          disabled={buying || (!owned && !canAfford)}
          className="w-full flex items-center justify-center gap-1.5 py-2 transition-colors disabled:opacity-60 active:scale-[0.98]"
          style={{
            background: owned ? "#222222" : "#10b981",
            color: "#fff",
            ...PIXEL,
            fontSize: 16,
            border: owned ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(16,185,129,0.4)",
          }}
        >
          {buying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : owned ? (
            <>Owned</>
          ) : !canAfford ? (
            <>Not enough Rings</>
          ) : (
            <span className="flex items-baseline" style={{ letterSpacing: "-0.03em" }}>
              Buy for&nbsp;<span style={{ color: "#A7F3D0" }}>$</span><span>R</span>
              <span className="ml-1 tabular-nums">{item.price.toLocaleString()}</span>
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function SectionHeader({ label, newTag }: { label: string; newTag?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ ...PIXEL, fontSize: 22, color: "#fff" }}>{label}</span>
      {newTag && (
        <span className="px-2 py-0.5"
          style={{ ...UI, fontSize: 10, fontWeight: 700, color: "#000", background: "#10b981", letterSpacing: "0.1em" }}>
          NEW
        </span>
      )}
    </div>
  );
}

/* ────────── ChatBlockPreview — Discord-style chat row showing the name color in real context ────────── */
function ChatBlockPreview({ name, aura, compact, avatarUrl }: { name: string; aura: AuraSlug; compact?: boolean; avatarUrl?: string | null }) {
  // sample chat lines so users immediately see "this is what my name looks like in chat"
  const SAMPLES: Record<AuraSlug, string> = {
    steve:     "mined ts in 4k 💎",
    specter:   "mined ts in 4k 💎",
    hellfire:  "this drop bouta cook 🔥",
    sovereign: "another w. crown stays on 👑",
  };
  const cfg = AURA_CFG[aura];
  const initial = (name?.[0] || "?").toUpperCase();
  const nameSize = compact ? 14 : 16;
  const msgSize = compact ? 12 : 14;
  const avatarSize = compact ? 32 : 40;
  const avatarColor = cfg?.labelColor || "#5865f2";

  return (
    <div className="absolute inset-0 flex items-center justify-center p-3">
      <div className="w-full max-w-[260px] flex items-start gap-2.5">
        {/* avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="rounded-full shrink-0 object-cover"
            style={{ width: avatarSize, height: avatarSize }}
          />
        ) : (
          <div
            className="rounded-full flex items-center justify-center shrink-0"
            style={{
              width: avatarSize,
              height: avatarSize,
              background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}55)`,
              color: "#fff",
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: compact ? 14 : 16,
            }}
          >
            {initial}
          </div>
        )}
        {/* message column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <AuraUsername
              username={name}
              aura={aura}
              style={{
                ...UI,
                fontSize: nameSize,
                fontWeight: 700,
                lineHeight: 1.1,
              } as React.CSSProperties}
            />
            <span style={{ ...UI, fontSize: 10, color: "#949ba4" }}>now</span>
          </div>
          <div className="truncate" style={{ ...UI, fontSize: msgSize, color: "#dbdee1", marginTop: 2 }}>
            {SAMPLES[aura] || "gg's"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────── PREVIEW MODAL ────────────────── */
function AuraPreviewModal({ item, onClose, viewerName, viewerAvatar }: { item: ShopItem; onClose: () => void; viewerName: string; viewerAvatar: string | null }) {
  // (unchanged)
  const auraSlug = item.name.toLowerCase() as AuraSlug;
  const bg = AURA_BG[auraSlug] || "linear-gradient(155deg, #1a1a1a, #444)";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden relative"
        style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <button onClick={onClose} aria-label="Close"
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center text-white hover:bg-black/80"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <X className="w-4 h-4" />
        </button>
        {/* Hero — real chat block preview */}
        <div className="relative overflow-hidden" style={{ background: "#0a0a0a", backgroundImage: bg, height: 200 }}>
          <ChatBlockPreview name={viewerName} avatarUrl={viewerAvatar} aura={auraSlug} />
        </div>
        {/* Sample usage strip */}
        <div className="p-4 space-y-3">
          <div style={{ ...UI, fontSize: 18, fontWeight: 700, color: "#fff" }}>{item.name}</div>
          <div style={{ ...UI, fontSize: 11, fontWeight: 600, color: "#949ba4", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Animated name color
          </div>
          {item.description && (
            <p style={{ ...UI, fontSize: 12, color: "#b5bac1", lineHeight: 1.5 }}>{item.description}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ────────────────── DAILY REWARDS ────────────────── */
function DailyRewardsTab() {
  const { user } = useAuth();
  const [todayDay, setTodayDay] = useState(1);
  const [streak, setStreak] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  const loadState = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("daily_streak, last_daily_claim_at")
      .eq("id", user.id)
      .maybeSingle();
    setLoading(false);
    if (!data) return;
    const today = new Date().toISOString().slice(0, 10);
    const last = (data as any).last_daily_claim_at as string | null;
    const curStreak = ((data as any).daily_streak as number) || 0;
    const alreadyClaimedToday = last === today;
    let nextDay: number;
    if (alreadyClaimedToday) {
      nextDay = ((curStreak - 1) % 7) + 1;
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const nextStreak = last === yesterday ? curStreak + 1 : 1;
      nextDay = ((nextStreak - 1) % 7) + 1;
    }
    setStreak(curStreak);
    setTodayDay(nextDay);
    setClaimedToday(alreadyClaimedToday);
  };

  useEffect(() => { loadState(); /* eslint-disable-next-line */ }, [user?.id]);

  const handleClaim = async () => {
    if (claiming || claimedToday) return;
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_daily_reward");
    setClaiming(false);
    if (error) { toast.error("Couldn't claim reward — try again"); return; }
    const res = data as any;
    if (res?.already_claimed) { setClaimedToday(true); return; }
    setClaimedToday(true);
    setStreak(res.streak);
    setTodayDay(res.day);
    toast.success(res.reward_kind === "xp" ? `+${res.reward_amount} XP claimed` : `+${res.reward_amount} Rings claimed`);
  };

  return (
    <div className="space-y-5">
      <SectionHeader label="DAILY LOGIN" />
      <div className="flex items-center justify-between">
        <span style={{ ...UI, fontSize: 11, fontWeight: 700, color: "#6ee7b7", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {streak} day streak
        </span>
        <span style={{ ...UI, fontSize: 11, fontWeight: 600, color: claimedToday ? "#4ade80" : "#949ba4", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {claimedToday ? "Claimed today — back tomorrow" : "Reward ready"}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden" style={{ background: "#222222" }}>
        <div className="h-full" style={{ width: `${(todayDay / 7) * 100}%`, background: "#10b981" }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {days.map((d) => {
          const claimed = d < todayDay || (d === todayDay && claimedToday);
          const isToday = d === todayDay && !claimedToday;
          const isXp = d !== 4 && d !== 7;
          const amount = isXp ? 50 + (d - 1) * 100 : d === 4 ? 50 : 200;
          return (
            <div key={d} className="relative p-3 flex flex-col items-center"
              style={{
                background: "#111114",
                border: isToday ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.08)",
                aspectRatio: "3/4",
                opacity: !claimed && !isToday ? 0.55 : 1,
              }}>
              <div className="w-full flex items-center justify-between">
                <span style={{ ...UI, fontSize: 11, fontWeight: 700, color: isToday ? "#fff" : "#949ba4" }}>Day {d}</span>
                {claimed && <Check className="w-3 h-3 text-green-400" strokeWidth={3} />}
              </div>
              <div className="flex-1 flex items-center justify-center my-2">
                <div className="w-14 h-14 flex items-center justify-center"
                  style={{
                    background: isXp
                      ? "radial-gradient(circle, #10b981, #064e3b)"
                      : "radial-gradient(circle, #FFD060, #4a3b00)",
                  }}>
                  {isXp ? (
                    <span style={{ ...UI, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>XP</span>
                  ) : (
                    <RingsCoin size={26} />
                  )}
                </div>
              </div>
              <span style={{ ...UI, fontSize: 13, fontWeight: 700, color: isXp ? "#6ee7b7" : "#FFD060" }}>+{amount}</span>
              <span style={{ ...UI, fontSize: 10, color: "#dbdee1", marginTop: 2 }}>
                {isXp ? "XP" : "Rings"}
              </span>
              <span style={{ ...UI, fontSize: 10, fontWeight: 600, color: claimed ? "#4ade80" : "#71717a", marginTop: 6 }}>
                {claimed ? "Claimed" : isToday ? "Claim" : "Locked"}
              </span>
            </div>
          );
        })}
      </div>
      <button
        onClick={claimedToday ? undefined : handleClaim}
        disabled={claimedToday || claiming || loading}
        className="font-display w-full flex items-center justify-center gap-2 py-3 uppercase transition-colors disabled:opacity-60"
        style={{
          background: claimedToday ? "#1f1f23" : "#10b981",
          color: claimedToday ? "#dbdee1" : "#0a0a0a",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "0.12em",
        }}
      >
        {claiming || loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : claimedToday ? (
          <><Check className="w-4 h-4" /> Already claimed today</>
        ) : (
          <>Claim Day {todayDay}</>
        )}
      </button>
    </div>
  );
}



/* ────────────────── BADGE COUNTDOWN ────────────────── */
function useCountdown(target: string | null | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return "EXPIRED";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m ${s}s`;
}

/* ────────────────── BADGE CARD ────────────────── */
function BadgeCard({ item, owned, buying, onBuy, onPreview, index }: {
  item: ShopItem; owned: boolean; buying: boolean;
  onBuy: () => void; onPreview: () => void; index: number;
}) {
  const countdown = useCountdown(item.available_until);
  const expired = countdown === "EXPIRED";
  const isOG = item.name === "OG Claim";
  const displayName = isOG ? "OG" : item.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
      className="relative flex flex-col overflow-hidden"
      style={{ background: "#111114", border: "1px solid rgba(255,190,40,0.25)" }}
    >
      <button
        onClick={onPreview}
        aria-label="Preview"
        className="relative w-full overflow-hidden flex items-center justify-center"
        style={{
          background: "#0a0a0a",
          aspectRatio: "1/1",
          backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,180,30,0.22), transparent 70%)",
        }}
      >
        {isOG ? <FoundingBadge size="md" animate={false} /> : (
          <span style={{ ...PIXEL, fontSize: 28, color: "#fff" }}>{displayName}</span>
        )}
        {item.is_limited && !owned && (
          <div className="absolute top-2 left-2 px-2 py-0.5 flex items-center gap-1"
            style={{ ...UI, background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,215,0,0.6)", fontSize: 10, fontWeight: 700, color: "#FFD060", letterSpacing: "0.1em" }}>
            <Clock className="w-3 h-3" /> LIMITED
          </div>
        )}
        {owned && (
          <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center" style={{ background: "#22c55e" }}>
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        )}
      </button>

      <div className="p-3 pt-2.5 flex flex-col gap-2">
        <div className="min-w-0">
          <div className="truncate" style={{ ...PIXEL, fontSize: 18, color: "#fff" }}>{displayName}</div>
          {item.is_limited && countdown && !owned && (
            <div className="flex items-center gap-1 mt-0.5 tabular-nums"
              style={{ ...UI, fontSize: 11, fontWeight: 700, color: expired ? "#ef4444" : "#FFD060", letterSpacing: "0.06em" }}>
              <Clock className="w-3 h-3" />
              {expired ? "GONE FOREVER" : `${countdown} LEFT`}
            </div>
          )}
          {!owned && !expired && (
            <div className="flex items-baseline mt-0.5" style={{ ...PIXEL, fontSize: 16, letterSpacing: "-0.03em" }}>
              {item.price === 0 ? (
                <span style={{ color: "#3BCB6B" }}>FREE</span>
              ) : (
                <>
                  <span style={{ color: "#3BCB6B" }}>$</span>
                  <span style={{ color: "#fff" }}>R</span>
                  <span className="ml-1 tabular-nums" style={{ color: "#fff" }}>{item.price.toLocaleString()}</span>
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onBuy}
          disabled={buying || expired}
          className="w-full flex items-center justify-center gap-1.5 py-2 transition-colors disabled:opacity-60 active:scale-[0.98]"
          style={{
            background: owned ? "#222222" : expired ? "#222222" : "#FFD060",
            color: owned || expired ? "#fff" : "#0a0a0a",
            ...PIXEL,
            fontSize: 16,
            border: owned || expired ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,215,0,0.7)",
          }}
        >
          {buying ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : owned ? <>Owned</>
            : expired ? <>Gone</>
            : item.price === 0 ? <>Claim Free</>
            : <>Buy</>}
        </button>
      </div>
    </motion.div>
  );
}

/* ────────────────── BADGE PREVIEW MODAL ────────────────── */
function BadgePreviewModal({ item, onClose }: { item: ShopItem; onClose: () => void }) {
  const countdown = useCountdown(item.available_until);
  const expired = countdown === "EXPIRED";
  const isOG = item.name === "OG Claim";
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden relative"
        style={{ background: "#111114", border: "1px solid rgba(255,190,40,0.3)" }}
      >
        <button onClick={onClose} aria-label="Close"
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center text-white hover:bg-black/80"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <X className="w-4 h-4" />
        </button>
        <div className="relative overflow-hidden flex items-center justify-center"
          style={{
            background: "#0a0a0a",
            backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,180,30,0.25), transparent 70%)",
            height: 260,
          }}>
          {isOG ? <FoundingBadge size="md" animate /> : (
            <span style={{ ...PIXEL, fontSize: 48, color: "#fff" }}>{item.name}</span>
          )}
        </div>
        <div className="p-4 space-y-3">
          <div style={{ ...UI, fontSize: 18, fontWeight: 700, color: "#fff" }}>{isOG ? "OG — Founding Member" : item.name}</div>
          <div style={{ ...UI, fontSize: 11, fontWeight: 600, color: "#FFD060", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Limited Badge · {expired ? "Gone Forever" : `${countdown} left`}
          </div>
          {item.description && (
            <p style={{ ...UI, fontSize: 12, color: "#b5bac1", lineHeight: 1.5 }}>{item.description}</p>
          )}
          <p style={{ ...UI, fontSize: 11, color: "#71717a", lineHeight: 1.5 }}>
            Equip from your Inventory to flex the OG chip across your profile, chat and scoreboards. Once the timer runs out this badge is removed from the shop forever.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
