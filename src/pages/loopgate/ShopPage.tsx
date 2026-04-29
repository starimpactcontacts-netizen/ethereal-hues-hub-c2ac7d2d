import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, Lock, ShoppingBag, Sparkles, Crown, Palette, Layers } from "lucide-react";
import RingsCoin from "@/components/loopgate/RingsCoin";
import FoundingBadge from "@/components/loopgate/FoundingBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  item_type: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
  stock: number | null;
  is_limited: boolean;
  available_until: string | null;
  total_claimed: number;
  rarity?: string;
}

const RARITY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  common:    { label: "COMMON",    color: "text-zinc-300",    bg: "bg-zinc-500/10",    border: "border-zinc-400/20" },
  uncommon:  { label: "UNCOMMON",  color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-400/25" },
  rare:      { label: "RARE",      color: "text-sky-300",     bg: "bg-sky-500/10",     border: "border-sky-400/25" },
  epic:      { label: "EPIC",      color: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-400/30" },
  legendary: { label: "LEGENDARY", color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-400/30" },
  mythic:    { label: "MYTHIC",    color: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-400/35" },
};

/* Obsidian thumbnail — Discord-style: faded mock profile card behind, frame floats on top */
function ObsidianFrameThumb() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Faded mock profile card in the background — clearly shows where the frame applies */}
      <div className="absolute inset-0 flex items-start justify-start p-2.5 opacity-60">
        <div
          className="w-[78%] h-[88%] rounded-lg p-2 flex flex-col gap-1.5"
          style={{
            background: "linear-gradient(180deg, #1a1a1d 0%, #131316 100%)",
            border: "0.5px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* mock avatar circle */}
          <div className="w-5 h-5 rounded-full bg-zinc-700/80 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 absolute translate-x-1.5 translate-y-1.5" />
          </div>
          {/* mock username + status lines */}
          <div className="space-y-1 mt-0.5">
            <div className="h-1 w-12 rounded-full bg-zinc-700/70" />
            <div className="h-1 w-8 rounded-full bg-zinc-800/80" />
          </div>
          {/* mock content lines */}
          <div className="space-y-1 mt-1">
            <div className="h-0.5 w-full rounded-full bg-zinc-800/70" />
            <div className="h-0.5 w-3/4 rounded-full bg-zinc-800/70" />
            <div className="h-0.5 w-2/3 rounded-full bg-zinc-800/70" />
          </div>
        </div>
      </div>

      {/* The cosmetic itself — Obsidian frame floating on the right, oversized hero */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2" style={{ width: "62%", aspectRatio: "1/1" }}>
        <div className="relative w-full h-full">
          {/* glow halo behind */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 70%)", filter: "blur(8px)" }}
          />
          {/* obsidian ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 32% 24%, #34343a 0%, #0a0a0c 55%, #000 100%)",
              border: "1.5px solid rgba(255,255,255,0.6)",
              boxShadow: "0 10px 28px -6px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.7)",
            }}
          />
          {/* inner avatar slot — mock discord-style icon */}
          <div
            className="absolute rounded-full bg-zinc-800 flex items-center justify-center"
            style={{
              top: "13%", left: "13%", right: "13%", bottom: "13%",
              border: "0.5px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="w-1/2 h-1/2 rounded-full bg-zinc-700/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeRemaining(until: string) {
  const diff = new Date(until).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

/* ---------- Floating Nav (iOS 18 dynamic island vibe) ---------- */
function FloatingNav({ rings, navigate, scrolled }: { rings: number; navigate: (p: string) => void; scrolled: boolean }) {
  return (
    <div className="sticky top-0 z-40 px-3 pt-3 pb-2 pointer-events-none">
      <motion.div
        initial={false}
        animate={{
          backgroundColor: scrolled ? "rgba(10,10,12,0.72)" : "rgba(10,10,12,0.35)",
          borderColor: scrolled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border backdrop-blur-2xl backdrop-saturate-150 flex items-center justify-between h-12 px-3"
        style={{ boxShadow: scrolled ? "0 8px 32px -8px rgba(0,0,0,0.5)" : "none" }}
      >
        <button
          onClick={() => navigate("/hub")}
          className="flex items-center justify-center w-9 h-9 -ml-1 rounded-xl text-foreground/70 hover:text-foreground active:scale-90 transition-all"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
        </button>

        <div className="flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-foreground/90" strokeWidth={2.4} />
          <span className="font-display text-[15px] tracking-wide text-foreground uppercase leading-none">Shop</span>
        </div>

        <motion.div
          whileTap={{ scale: 0.94 }}
          className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.08] rounded-full pl-1 pr-2.5 py-1"
        >
          <RingsCoin size={18} />
          <span className="text-[12px] font-bold tabular-nums text-foreground leading-none">{rings.toLocaleString()}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------- Parallax Hero ---------- */
function HeroBanner({
  ogItem,
  ogOwned,
  ogExpired,
  ogTimeLeft,
  claiming,
  onClaim,
  scrollY,
}: {
  ogItem: ShopItem;
  ogOwned: boolean;
  ogExpired: boolean;
  ogTimeLeft: string | null;
  claiming: string | null;
  onClaim: (item: ShopItem) => void;
  scrollY: any;
}) {
  const y = useTransform(scrollY, [0, 400], [0, 80]);
  const scale = useTransform(scrollY, [0, 400], [1, 1.08]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.4]);

  const interactable = !ogOwned && !ogExpired && claiming !== ogItem.id;

  return (
    <div className="relative px-3 -mt-2">
      <motion.button
        onClick={() => interactable && onClaim(ogItem)}
        disabled={!interactable}
        whileTap={interactable ? { scale: 0.985 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full relative overflow-hidden text-left rounded-[28px] block"
        style={{ aspectRatio: "16 / 11" }}
      >
        {/* Animated gradient base */}
        <motion.div
          className="absolute inset-0"
          style={{ scale, opacity }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_30%,rgba(196,164,74,0.25),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_20%_80%,rgba(255,255,255,0.05),transparent_70%)]" />
          {/* Grain */}
          <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
               style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E\")" }} />
        </motion.div>

        {/* Profile preview — shows EXACTLY what you get */}
        <motion.div
          style={{ y }}
          className="absolute top-1/2 right-3 sm:right-8 -translate-y-1/2 flex items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -4, 0, 4, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute -inset-4 blur-3xl bg-amber-400/25 rounded-full" />
            {/* Mock profile card */}
            <div className="relative w-[150px] sm:w-[180px] rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-amber-400/20 p-3 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)]">
              <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-2">Your Profile</div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center font-display text-sm text-foreground/70">U</div>
                <div className="flex-1 min-w-0">
                  <div className="h-2 w-16 bg-foreground/20 rounded-sm mb-1" />
                  <div className="h-1.5 w-10 bg-foreground/10 rounded-sm" />
                </div>
              </div>
              {/* The actual badge they get, pinned */}
              <div className="flex justify-start">
                <FoundingBadge size="md" animate />
              </div>
              {/* Pin arrow */}
              <div className="absolute -top-2 right-4 px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[7px] font-black uppercase tracking-wider">
                Equipped
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-5 sm:p-8">
          {/* Top row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-amber-400/15 backdrop-blur-md border border-amber-400/30 rounded-full px-2.5 py-1">
              <Crown className="w-3 h-3 text-amber-300" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-200">Prestige · Profile Badge</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-200">Limited</span>
            </div>
            {ogOwned && (
              <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-400/30 rounded-full px-2 py-1">
                <Check className="w-3 h-3 text-emerald-300" strokeWidth={3} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Owned</span>
              </div>
            )}
          </div>

          {/* Bottom content */}
          <div className="max-w-[55%]">
            <h1 className="font-display text-3xl sm:text-5xl tracking-tight text-foreground leading-[0.95]">
              First<br />Circle
            </h1>
            <p className="text-[11px] sm:text-sm text-foreground/70 mt-2 leading-snug line-clamp-3">
              A permanent prestige badge stamped on your profile. Worn forever as proof you were here first. <span className="text-amber-300/90 font-semibold">Cosmetic only.</span>
            </p>

            <div className="flex items-center gap-3 mt-3 text-[11px]">
              {ogExpired ? (
                <span className="font-semibold text-foreground/40">No longer available</span>
              ) : (
                <>
                  <span className="font-bold text-foreground">FREE</span>
                  <span className="w-1 h-1 rounded-full bg-foreground/30" />
                  <span className="text-foreground/60 tabular-nums">{ogItem.total_claimed} claimed</span>
                  {ogTimeLeft && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-foreground/30" />
                      <span className="font-semibold text-amber-300 tabular-nums">{ogTimeLeft} left</span>
                    </>
                  )}
                </>
              )}
            </div>

            {interactable && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 inline-flex items-center gap-1.5 bg-foreground text-background text-[13px] font-bold px-5 py-2.5 rounded-full"
              >
                Claim Badge
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
              </motion.div>
            )}
            {claiming === ogItem.id && (
              <div className="mt-4 inline-flex items-center gap-2 bg-foreground/30 text-foreground text-[13px] font-bold px-5 py-2.5 rounded-full">
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Claiming…
              </div>
            )}
          </div>
        </div>
      </motion.button>
    </div>
  );
}

/* ---------- Category Pills ---------- */
const CATEGORIES = [
  { id: "all", label: "All", icon: Layers },
  { id: "cosmetics", label: "Cosmetics", icon: Palette },
  { id: "prestige", label: "Prestige", icon: Crown },
  { id: "limited", label: "Limited", icon: Sparkles },
];

function CategoryPills({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="px-3 -mx-3 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 px-3 pb-1">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.id;
          return (
            <motion.button
              key={c.id}
              onClick={() => onChange(c.id)}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[12px] font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "bg-white/[0.04] text-foreground/70 border-white/[0.06] hover:bg-white/[0.08]"
              )}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
              {c.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Coming Soon Tile ---------- */
function ComingSoonTile({ index }: { index: number }) {
  const gradients = [
    "from-zinc-800/60 to-zinc-950",
    "from-violet-950/40 to-zinc-950",
    "from-rose-950/30 to-zinc-950",
    "from-sky-950/40 to-zinc-950",
    "from-emerald-950/30 to-zinc-950",
    "from-amber-950/30 to-zinc-950",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 30 }}
      whileTap={{ scale: 0.97 }}
      className="group cursor-pointer"
    >
      <div className={cn(
        "aspect-square rounded-2xl border border-white/[0.06] flex items-center justify-center mb-2 relative overflow-hidden bg-gradient-to-br",
        gradients[index % gradients.length]
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_60%)]" />
        <Lock className="w-5 h-5 text-foreground/20 relative z-10" strokeWidth={2} />
      </div>
      <p className="text-[12px] font-semibold text-foreground/50 truncate px-0.5">Coming soon</p>
      <p className="text-[10px] text-foreground/30 mt-0.5 flex items-center gap-1 px-0.5 font-semibold">
        ??? <span className="tracking-wider">Rings</span>
      </p>
    </motion.div>
  );
}

/* ---------- Collection Card ---------- */
function CollectionCard({ title, subtitle, accent, icon: Icon, delay }: { title: string; subtitle: string; accent: string; icon: any; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 30 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-3xl overflow-hidden relative cursor-pointer border border-white/[0.06]"
      style={{ background: `linear-gradient(135deg, ${accent}, rgba(10,10,12,1) 70%)` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="relative p-5 flex flex-col justify-between min-h-[170px]">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.08] backdrop-blur-md border border-white/[0.1] flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-foreground/90" strokeWidth={2.2} />
        </div>
        <div>
          <h3 className="font-display text-xl tracking-tight text-foreground leading-tight">{title}</h3>
          <p className="text-[11px] text-foreground/50 mt-1 leading-snug">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<Set<string>>(new Set());
  const [rings, setRings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setScrolled(v > 12));
    return () => unsub();
  }, [scrollY]);

  const fetchData = useCallback(async () => {
    const [itemsRes, purchasesRes, profileRes] = await Promise.all([
      supabase.from("shop_items").select("*").eq("is_active", true),
      user
        ? supabase.from("shop_purchases").select("item_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from("profiles").select("rings").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);
    if (itemsRes.data) setItems(itemsRes.data as unknown as ShopItem[]);
    if (purchasesRes.data) setPurchases(new Set((purchasesRes.data as any[]).map((p) => p.item_id)));
    if (profileRes.data) setRings((profileRes.data as any)?.rings || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleClaim = async (item: ShopItem) => {
    if (!user) { toast.error("Sign in to claim items"); return; }
    if (purchases.has(item.id)) return;
    if (item.available_until && new Date(item.available_until) < new Date()) {
      toast.error("This item is no longer available"); return;
    }
    if (item.price > 0 && rings < item.price) {
      toast.error("Not enough Rings"); return;
    }
    setClaiming(item.id);
    if (item.price > 0) {
      const { error: spendErr } = await supabase
        .from("profiles")
        .update({ rings: rings - item.price } as any)
        .eq("id", user.id);
      if (spendErr) { toast.error("Not enough Rings"); setClaiming(null); return; }
    }
    const { error } = await supabase.from("shop_purchases").insert({ user_id: user.id, item_id: item.id } as any);
    if (error) {
      if (error.code === "23505") toast.error("Already claimed!");
      else toast.error("Failed to claim");
      setClaiming(null); return;
    }
    if (item.name === "OG Claim") {
      await supabase.from("profiles").update({ is_founding_member: true } as any).eq("id", user.id);
    }
    toast.success(`${item.name} claimed!`);
    setPurchases((prev) => new Set([...prev, item.id]));
    setRings((prev) => prev - item.price);
    setClaiming(null);
  };

  const ogItem = items.find(i => i.name === "OG Claim");
  const ogOwned = ogItem ? purchases.has(ogItem.id) : false;
  const ogExpired = ogItem?.available_until ? new Date(ogItem.available_until) < new Date() : false;
  const ogTimeLeft = ogItem?.available_until ? getTimeRemaining(ogItem.available_until) : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/[0.03] rounded-full blur-[120px]" />
      </div>

      <div ref={scrollRef} className="relative h-full overflow-y-auto overscroll-y-contain">
        <FloatingNav rings={rings} navigate={navigate} scrolled={scrolled} />

        {loading ? (
          <div className="px-3 space-y-4 mt-2">
            <div className="rounded-[28px] aspect-[16/11] bg-white/[0.03] animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 px-1">
              {[1,2,3,4,5,6].map(i => (
                <div key={i}>
                  <div className="aspect-square rounded-2xl bg-white/[0.03] animate-pulse mb-2" />
                  <div className="h-2.5 w-16 bg-white/[0.03] animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="pb-32"
            >
              {/* Hero */}
              {ogItem && (
                <HeroBanner
                  ogItem={ogItem}
                  ogOwned={ogOwned}
                  ogExpired={ogExpired}
                  ogTimeLeft={ogTimeLeft}
                  claiming={claiming}
                  onClaim={handleClaim}
                  scrollY={scrollY}
                />
              )}

              {/* Categories */}
              <div className="mt-6">
                <CategoryPills active={activeCategory} onChange={setActiveCategory} />
              </div>

              {/* Drops grid */}
              <div className="px-4 mt-5">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <h2 className="font-display text-[20px] tracking-tight text-foreground leading-tight">Latest Drops</h2>
                    <p className="text-[11px] text-foreground/40 mt-0.5">Live in the shop</p>
                  </div>
                </div>

                {(() => {
                  const liveItems = items.filter((i) => i.name !== "OG Claim");
                  const fillerCount = Math.max(0, 6 - liveItems.length);
                  return (
                    <div className="grid grid-cols-3 gap-2.5">
                      {liveItems.map((item) => {
                        const owned = purchases.has(item.id);
                        const isClaiming = claiming === item.id;
                        const canAfford = rings >= item.price;
                        const rarity = RARITY_META[item.rarity || "common"] || RARITY_META.common;
                          const isObsidian = item.name === "Obsidian";
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => !owned && !isClaiming && handleClaim(item)}
                            whileTap={{ scale: 0.97 }}
                            disabled={owned || isClaiming}
                            className="text-left group"
                          >
                            <div className={cn(
                              "aspect-square rounded-2xl border mb-2 relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black",
                              rarity.border
                            )}>
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.06),transparent_60%)]" />
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : isObsidian ? (
                                <ObsidianFrameThumb />
                              ) : (
                                <div className="w-12 h-12 rounded-full border border-white/15" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 60%)" }} />
                              )}
                              {/* Rarity tag */}
                              <div className={cn(
                                "absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md backdrop-blur-md border text-[8px] font-black tracking-[0.12em] leading-none",
                                rarity.bg, rarity.border, rarity.color
                              )}>
                                {rarity.label}
                              </div>
                              {/* Type tag — explicit Cosmetic / Prestige label */}
                              <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md backdrop-blur-md border border-white/10 bg-black/50 text-foreground/70 text-[8px] font-black tracking-[0.12em] leading-none uppercase">
                                {item.item_type === "prestige" ? "Prestige" : "Cosmetic"}
                              </div>
                              {owned && (
                                <div className="absolute top-1.5 right-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-full p-1">
                                  <Check className="w-3 h-3 text-emerald-300" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <p className="text-[12px] font-semibold text-foreground truncate px-0.5">{item.name}</p>
                            <div className={cn(
                              "mt-0.5 flex items-center gap-1 px-0.5 font-semibold tabular-nums",
                              owned ? "text-emerald-300" : canAfford ? "text-foreground/80" : "text-foreground/30"
                            )}>
                              {owned ? (
                                <span className="text-[10px]">Owned</span>
                              ) : isClaiming ? (
                                <span className="text-[10px]">Claiming…</span>
                              ) : (
                                <>
                                  <RingsCoin size={11} />
                                  <span className="text-[10px]">{item.price.toLocaleString()}</span>
                                </>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                      {Array.from({ length: fillerCount }).map((_, i) => (
                        <ComingSoonTile key={i} index={i} />
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Collections */}
              <div className="px-4 mt-8">
                <div className="mb-3">
                  <h2 className="font-display text-[20px] tracking-tight text-foreground leading-tight">Collections</h2>
                  <p className="text-[11px] text-foreground/40 mt-0.5">Curated drops by category</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <CollectionCard
                    title="Cosmetics"
                    subtitle="Frames, effects & avatar decorations"
                    accent="rgba(139,92,246,0.18)"
                    icon={Palette}
                    delay={0.05}
                  />
                  <CollectionCard
                    title="Prestige"
                    subtitle="Profile skins, nameplates & banners"
                    accent="rgba(196,164,74,0.18)"
                    icon={Crown}
                    delay={0.1}
                  />
                  <CollectionCard
                    title="Effects"
                    subtitle="Live reactions & post overlays"
                    accent="rgba(236,72,153,0.16)"
                    icon={Sparkles}
                    delay={0.15}
                  />
                  <CollectionCard
                    title="Vault"
                    subtitle="Locked archives & legacy gear"
                    accent="rgba(56,189,248,0.16)"
                    icon={Lock}
                    delay={0.2}
                  />
                </div>
              </div>

              {/* Footer note */}
              <div className="px-4 mt-10 text-center">
                <p className="text-[10px] text-foreground/30 uppercase tracking-[0.2em] font-semibold">— More drops loading —</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
