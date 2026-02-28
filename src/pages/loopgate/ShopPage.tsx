import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Coins, Check, ChevronLeft, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Shop item preview images
import imgOG from "@/assets/shop/og-claim.jpg";
import imgMidnightEmber from "@/assets/shop/midnight-ember.jpg";
import imgNeonCircuit from "@/assets/shop/neon-circuit.jpg";
import imgPhantomRose from "@/assets/shop/phantom-rose.jpg";
import imgChromeWave from "@/assets/shop/chrome-wave.jpg";
import imgSakuraDrift from "@/assets/shop/sakura-drift.jpg";
import imgVoidWalker from "@/assets/shop/void-walker.jpg";

const LOCAL_IMAGES: Record<string, string> = {
  "OG Claim": imgOG,
  "Midnight Ember": imgMidnightEmber,
  "Neon Circuit": imgNeonCircuit,
  "Phantom Rose": imgPhantomRose,
  "Chrome Wave": imgChromeWave,
  "Sakura Drift": imgSakuraDrift,
  "Void Walker": imgVoidWalker,
};

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
}

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "avatar_decoration", label: "Avatar Decorations" },
  { key: "profile_effect", label: "Profile Effects" },
  { key: "nameplate", label: "Nameplates" },
  { key: "badge", label: "Badges" },
];

function getTimeRemaining(until: string) {
  const diff = new Date(until).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

export default function ShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<Set<string>>(new Set());
  const [spendableIndex, setSpendableIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [itemsRes, purchasesRes, profileRes] = await Promise.all([
      supabase.from("shop_items").select("*").eq("is_active", true),
      user
        ? supabase.from("shop_purchases").select("item_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
      user
        ? supabase.from("profiles").select("spendable_index").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
    ]);
    if (itemsRes.data) setItems(itemsRes.data as unknown as ShopItem[]);
    if (purchasesRes.data) setPurchases(new Set((purchasesRes.data as any[]).map((p) => p.item_id)));
    if (profileRes.data) setSpendableIndex((profileRes.data as any)?.spendable_index || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleClaim = async (item: ShopItem) => {
    if (!user) { toast.error("Sign in to claim items"); return; }
    if (purchases.has(item.id)) return;
    if (item.available_until && new Date(item.available_until) < new Date()) {
      toast.error("This item is no longer available"); return;
    }
    if (item.price > 0 && spendableIndex < item.price) {
      toast.error("Not enough Index Points"); return;
    }
    setClaiming(item.id);
    if (item.price > 0) {
      const { data: success } = await supabase.rpc("spend_index", { p_user_id: user.id, p_amount: item.price });
      if (!success) { toast.error("Not enough Index Points"); setClaiming(null); return; }
    }
    const { error } = await supabase.from("shop_purchases").insert({ user_id: user.id, item_id: item.id } as any);
    if (error) {
      if (error.code === "23505") toast.error("Already claimed!");
      else toast.error("Failed to claim");
      setClaiming(null); return;
    }
    toast.success(`${item.name} claimed!`, { description: item.price === 0 ? "Free item claimed" : `Spent ${item.price} Index` });
    setPurchases((prev) => new Set([...prev, item.id]));
    setSpendableIndex((prev) => prev - item.price);
    setClaiming(null);
  };

  const filtered = activeCategory === "all" ? items : items.filter((i) => i.category === activeCategory);
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_limited && !b.is_limited) return -1;
    if (!a.is_limited && b.is_limited) return 1;
    return b.price - a.price;
  });

  // Separate hero item (OG Claim) from grid items
  const heroItem = sorted.find(i => i.name === "OG Claim");
  const gridItems = sorted.filter(i => i.name !== "OG Claim");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate("/hub")} className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Hub
          </button>
          <div className="flex items-center gap-2 bg-surface-1 border border-border rounded-full px-3.5 py-1.5">
            <Coins className="w-3.5 h-3.5 text-gold" />
            <span className="text-sm font-bold tabular-nums text-foreground">{spendableIndex}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Index</span>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="font-display text-3xl tracking-wide text-foreground mb-0.5">SHOP</h1>
          <p className="text-xs text-muted-foreground">Cosmetics, effects & collectibles</p>
        </div>

        {/* Category Nav */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? "bg-foreground text-background"
                  : "bg-surface-1 text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3">
        {loading ? (
          <div className="space-y-3">
            <div className="aspect-[2/1] bg-surface-1 rounded-xl animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] bg-surface-1 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No items in this category yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Hero Card — OG Claim */}
            {heroItem && (activeCategory === "all" || activeCategory === "badge") && (
              <HeroCard
                item={heroItem}
                owned={purchases.has(heroItem.id)}
                claiming={claiming === heroItem.id}
                onClaim={() => handleClaim(heroItem)}
              />
            )}

            {/* Batch Label */}
            <div className="flex items-center gap-3 pt-2 pb-1">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Batch 001</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {gridItems.map((item, i) => (
                  <GridCard
                    key={item.id}
                    item={item}
                    owned={purchases.has(item.id)}
                    claiming={claiming === item.id}
                    onClaim={() => handleClaim(item)}
                    canAfford={item.price === 0 || spendableIndex >= item.price}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Hero Card (OG Claim - full width featured) ── */
function HeroCard({ item, owned, claiming, onClaim }: { item: ShopItem; owned: boolean; claiming: boolean; onClaim: () => void }) {
  const timeLeft = item.available_until ? getTimeRemaining(item.available_until) : null;
  const isExpired = item.available_until && new Date(item.available_until) < new Date();
  const img = LOCAL_IMAGES[item.name];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-xl overflow-hidden border border-gold/30 shadow-[0_0_30px_-8px_hsl(var(--gold)/0.25)]"
    >
      {/* Image */}
      <div className="aspect-[2/1] relative">
        {img && <img src={img} alt={item.name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Limited tag */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md">
          <Clock className="w-3 h-3" />
          Limited Time
        </div>

        <div className="absolute top-3 right-3">
          <Crown className="w-5 h-5 text-gold" />
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <h2 className="font-display text-2xl tracking-wide text-white mb-0.5">{item.name.toUpperCase()}</h2>
          <p className="text-xs text-white/70 mb-3 line-clamp-2">{item.description}</p>

          <div className="flex items-center gap-3">
            {owned ? (
              <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg px-4 py-2 text-sm font-semibold">
                <Check className="w-4 h-4" />
                Owned
              </div>
            ) : isExpired ? (
              <div className="text-sm text-muted-foreground font-medium">No longer available</div>
            ) : (
              <Button
                onClick={onClaim}
                disabled={claiming}
                className="bg-gold hover:bg-gold/90 text-black font-bold px-6 h-10 text-sm rounded-lg"
              >
                {claiming ? "Claiming..." : "Claim Free"}
              </Button>
            )}

            {timeLeft && !owned && !isExpired && (
              <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                <Clock className="w-3 h-3" />
                {timeLeft}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Grid Card (standard items) ── */
function GridCard({
  item, owned, claiming, onClaim, canAfford, index,
}: {
  item: ShopItem; owned: boolean; claiming: boolean; onClaim: () => void; canAfford: boolean; index: number;
}) {
  const isExpired = item.available_until && new Date(item.available_until) < new Date();
  const timeLeft = item.available_until ? getTimeRemaining(item.available_until) : null;
  const img = LOCAL_IMAGES[item.name] || item.image_url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={`group relative rounded-xl overflow-hidden border transition-all ${
        item.is_limited
          ? "border-gold/25 shadow-[0_0_20px_-6px_hsl(var(--gold)/0.15)]"
          : "border-border/50 hover:border-border"
      } ${owned ? "opacity-60" : ""}`}
    >
      {/* Image Preview */}
      <div className="aspect-square relative overflow-hidden bg-surface-1">
        {img ? (
          <img src={img} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-surface-1 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-muted-foreground/20" />
          </div>
        )}

        {/* Dark gradient at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Limited badge */}
        {item.is_limited && !isExpired && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/90 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">
            <Clock className="w-2.5 h-2.5" />
            Limited
          </div>
        )}

        {/* Stock */}
        {item.is_limited && item.stock && !isExpired && (
          <div className="absolute top-2 right-2 text-[8px] font-semibold text-white/60 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
            {item.stock - item.total_claimed} left
          </div>
        )}

        {/* Owned overlay */}
        {owned && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg px-3 py-1.5 text-xs font-semibold">
              <Check className="w-3 h-3" />
              Owned
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 bg-surface-0">
        <h3 className="text-[13px] font-bold text-foreground truncate">{item.name}</h3>

        {/* Time remaining */}
        {timeLeft && !owned && (
          <div className="flex items-center gap-1 text-[9px] text-red-400 mt-0.5 mb-1">
            <Clock className="w-2.5 h-2.5" />
            {timeLeft}
          </div>
        )}

        {/* Price / Action */}
        {owned ? (
          <div className="text-[10px] text-muted-foreground mt-1">In your collection</div>
        ) : isExpired ? (
          <div className="text-[10px] text-muted-foreground mt-1">Expired</div>
        ) : (
          <div className="mt-1.5">
            {item.price === 0 ? (
              <Button
                size="sm"
                onClick={onClaim}
                disabled={claiming}
                className="w-full h-7 text-[11px] font-bold rounded-lg bg-gold hover:bg-gold/90 text-black"
              >
                {claiming ? "..." : "Claim Free"}
              </Button>
            ) : (
              <button
                onClick={onClaim}
                disabled={claiming || !canAfford}
                className={`w-full h-7 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  canAfford
                    ? "bg-surface-1 hover:bg-surface-2 text-foreground border border-border/60"
                    : "bg-surface-1/50 text-muted-foreground cursor-not-allowed border border-border/30"
                }`}
              >
                <Coins className="w-3 h-3 text-gold" />
                {claiming ? "..." : `${item.price}`}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
