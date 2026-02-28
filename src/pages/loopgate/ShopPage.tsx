import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Clock, Coins, Check, ChevronLeft, Sparkles, Crown, Star, Flame, Zap, Flower2, CircuitBoard, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

// Cosmetic gradient themes for items without images
const ITEM_THEMES: Record<string, { gradient: string; icon: React.ElementType; accent: string }> = {
  "OG Claim": { gradient: "from-amber-900/60 via-yellow-900/40 to-amber-950/80", icon: Shield, accent: "text-gold" },
  "Midnight Ember": { gradient: "from-red-950/80 via-orange-950/60 to-zinc-950", icon: Flame, accent: "text-red-400" },
  "Neon Circuit": { gradient: "from-cyan-950/80 via-blue-950/60 to-indigo-950/80", icon: CircuitBoard, accent: "text-cyan-400" },
  "Phantom Rose": { gradient: "from-purple-950/80 via-pink-950/60 to-zinc-950", icon: Flower2, accent: "text-purple-400" },
  "Chrome Wave": { gradient: "from-slate-800/80 via-zinc-700/40 to-slate-900/80", icon: Zap, accent: "text-slate-300" },
  "Sakura Drift": { gradient: "from-pink-950/60 via-rose-900/40 to-pink-950/80", icon: Flower2, accent: "text-pink-400" },
  "Void Walker": { gradient: "from-indigo-950/80 via-violet-950/60 to-zinc-950", icon: Ghost, accent: "text-violet-400" },
};

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaim = async (item: ShopItem) => {
    if (!user) {
      toast.error("Sign in to claim items");
      return;
    }
    if (purchases.has(item.id)) return;
    if (item.available_until && new Date(item.available_until) < new Date()) {
      toast.error("This item is no longer available");
      return;
    }
    if (item.price > 0 && spendableIndex < item.price) {
      toast.error("Not enough Index Points");
      return;
    }

    setClaiming(item.id);

    if (item.price > 0) {
      const { data: success } = await supabase.rpc("spend_index", {
        p_user_id: user.id,
        p_amount: item.price,
      });
      if (!success) {
        toast.error("Not enough Index Points");
        setClaiming(null);
        return;
      }
    }

    const { error } = await supabase.from("shop_purchases").insert({
      user_id: user.id,
      item_id: item.id,
    } as any);

    if (error) {
      if (error.code === "23505") toast.error("Already claimed!");
      else toast.error("Failed to claim");
      setClaiming(null);
      return;
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

        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Shop</h1>
          <p className="text-sm text-muted-foreground">Cosmetics, effects & collectibles — powered by Index</p>
        </div>

        {/* Category Nav */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? "bg-foreground text-background"
                  : "bg-surface-1 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Batch 001</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] bg-surface-1 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No items in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {sorted.map((item, i) => (
                <ShopItemCard
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
        )}
      </div>
    </div>
  );
}

function ShopItemCard({
  item,
  owned,
  claiming,
  onClaim,
  canAfford,
  index,
}: {
  item: ShopItem;
  owned: boolean;
  claiming: boolean;
  onClaim: () => void;
  canAfford: boolean;
  index: number;
}) {
  const isExpired = item.available_until && new Date(item.available_until) < new Date();
  const timeLeft = item.available_until ? getTimeRemaining(item.available_until) : null;
  const theme = ITEM_THEMES[item.name] || { gradient: "from-zinc-900/80 via-zinc-800/40 to-zinc-900/80", icon: Star, accent: "text-muted-foreground" };
  const Icon = theme.icon;

  const categoryLabel = CATEGORIES.find(c => c.key === item.category)?.label || item.category;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`group relative rounded-xl border overflow-hidden transition-all ${
        item.is_limited
          ? "border-gold/30 shadow-[0_0_24px_-8px_hsl(var(--gold)/0.2)]"
          : "border-border/60 hover:border-border"
      } ${owned ? "opacity-70" : ""}`}
    >
      {/* Visual Preview */}
      <div className={`aspect-[4/3] relative bg-gradient-to-br ${theme.gradient} flex items-center justify-center overflow-hidden`}>
        {/* Decorative particles */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/60 rounded-full" />
          <div className="absolute top-1/3 right-1/3 w-0.5 h-0.5 bg-white/40 rounded-full" />
          <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-white/30 rounded-full" />
          <div className="absolute top-2/3 right-1/4 w-0.5 h-0.5 bg-white/50 rounded-full" />
        </div>

        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center ${theme.accent}`}>
              <Icon className="w-7 h-7" />
            </div>
          </div>
        )}

        {/* Limited tag */}
        {item.is_limited && !isExpired && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/90 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md">
            <Clock className="w-2.5 h-2.5" />
            Limited
          </div>
        )}

        {/* Stock count for limited */}
        {item.is_limited && item.stock && !isExpired && (
          <div className="absolute top-2 right-2 text-[9px] font-semibold text-white/60 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            {item.stock - item.total_claimed} left
          </div>
        )}

        {/* Owned overlay */}
        {owned && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[3px] flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg px-3 py-1.5 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              Owned
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 bg-surface-0">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">{categoryLabel}</div>
        <h3 className="text-sm font-bold text-foreground truncate mb-0.5">{item.name}</h3>
        {item.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">{item.description}</p>
        )}

        {/* Time remaining */}
        {timeLeft && !owned && (
          <div className="flex items-center gap-1 text-[10px] text-red-400 mb-2">
            <Clock className="w-3 h-3" />
            {timeLeft}
          </div>
        )}

        {/* Price / Action */}
        {owned ? (
          <div className="text-[10px] text-muted-foreground font-medium">In your collection</div>
        ) : isExpired ? (
          <div className="text-[10px] text-muted-foreground font-medium">No longer available</div>
        ) : (
          <Button
            size="sm"
            onClick={onClaim}
            disabled={claiming || !canAfford}
            className={`w-full h-8 text-xs font-semibold rounded-lg ${
              item.price === 0
                ? "bg-gold hover:bg-gold/90 text-black"
                : canAfford
                ? "bg-foreground/10 hover:bg-foreground/15 text-foreground border border-border"
                : "bg-muted/20 text-muted-foreground cursor-not-allowed"
            }`}
          >
            {claiming ? (
              "Claiming..."
            ) : item.price === 0 ? (
              "Claim Free"
            ) : (
              <span className="flex items-center gap-1.5">
                <Coins className="w-3 h-3 text-gold" />
                {item.price} Index
              </span>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
