import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Clock, Coins, Check, ChevronLeft, Sparkles, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import loopgateLogo from "@/assets/loopgate-logo.png";

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
  { key: "badge", label: "Badges" },
  { key: "avatar_frame", label: "Avatar Frames" },
  { key: "profile_skin", label: "Profile Skins" },
  { key: "nameplate", label: "Nameplates" },
  { key: "banner", label: "Banners" },
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

    // Check balance for paid items
    if (item.price > 0 && spendableIndex < item.price) {
      toast.error("Not enough Index Points");
      return;
    }

    setClaiming(item.id);

    // Deduct index if paid
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

  // Sort: limited items first, then by price desc
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_limited && !b.is_limited) return -1;
    if (!a.is_limited && b.is_limited) return 1;
    return b.price - a.price;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        <div className="relative px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate("/hub")} className="flex items-center gap-1 text-muted-foreground text-sm">
              <ChevronLeft className="w-4 h-4" />
              Hub
            </button>
            <div className="flex items-center gap-2 bg-card/60 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1.5">
              <Coins className="w-3.5 h-3.5 text-gold" />
              <span className="text-sm font-bold tabular-nums">{spendableIndex}</span>
              <span className="text-[10px] text-muted-foreground uppercase">Index</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight mb-1">Shop</h1>
          <p className="text-sm text-muted-foreground">Spend your earned Index on exclusive cosmetics & badges</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? "bg-gold text-black"
                  : "bg-card/60 text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-card/40 rounded-xl animate-pulse" />
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
              {sorted.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  owned={purchases.has(item.id)}
                  claiming={claiming === item.id}
                  onClaim={() => handleClaim(item)}
                  canAfford={item.price === 0 || spendableIndex >= item.price}
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
}: {
  item: ShopItem;
  owned: boolean;
  claiming: boolean;
  onClaim: () => void;
  canAfford: boolean;
}) {
  const isExpired = item.available_until && new Date(item.available_until) < new Date();
  const timeLeft = item.available_until ? getTimeRemaining(item.available_until) : null;
  const isOG = item.name === "OG Claim";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative rounded-xl border overflow-hidden transition-all ${
        isOG
          ? "border-gold/40 bg-gradient-to-b from-gold/10 via-card/80 to-card/60 shadow-[0_0_20px_-5px_hsl(var(--gold)/0.3)]"
          : "border-border/50 bg-card/60"
      } ${owned ? "opacity-80" : ""}`}
    >
      {/* Limited badge */}
      {item.is_limited && !isExpired && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-500/90 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">
          <Clock className="w-2.5 h-2.5" />
          Limited
        </div>
      )}

      {/* OG badge */}
      {isOG && (
        <div className="absolute top-2 right-2 z-10">
          <Crown className="w-4 h-4 text-gold" />
        </div>
      )}

      {/* Preview area */}
      <div className="aspect-square relative flex items-center justify-center p-4">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-contain rounded-lg" />
        ) : isOG ? (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/30 via-gold/10 to-transparent border-2 border-gold/40 flex items-center justify-center">
            <Shield className="w-10 h-10 text-gold" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl bg-muted/20 flex items-center justify-center">
            <Star className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Owned overlay */}
        {owned && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/40 text-green-400 rounded-full px-3 py-1 text-xs font-semibold">
              <Check className="w-3 h-3" />
              Owned
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3">
        <h3 className="text-sm font-bold truncate mb-0.5">{item.name}</h3>
        {item.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{item.description}</p>
        )}

        {/* Time remaining */}
        {timeLeft && !owned && (
          <div className="flex items-center gap-1 text-[10px] text-red-400 mb-2">
            <Clock className="w-3 h-3" />
            {timeLeft}
          </div>
        )}

        {/* Price / Claim button */}
        {owned ? (
          <div className="text-[10px] text-muted-foreground">Claimed</div>
        ) : isExpired ? (
          <div className="text-[10px] text-muted-foreground">Expired</div>
        ) : (
          <Button
            size="sm"
            onClick={onClaim}
            disabled={claiming || !canAfford}
            className={`w-full h-8 text-xs font-semibold ${
              item.price === 0
                ? "bg-gold hover:bg-gold/90 text-black"
                : canAfford
                ? "bg-foreground/10 hover:bg-foreground/20 text-foreground border border-border/50"
                : "bg-muted/20 text-muted-foreground cursor-not-allowed"
            }`}
          >
            {claiming ? (
              "Claiming..."
            ) : item.price === 0 ? (
              "Claim Free"
            ) : (
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {item.price}
              </span>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
