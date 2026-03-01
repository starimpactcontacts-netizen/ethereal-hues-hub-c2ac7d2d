import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Coins, Check, ChevronLeft, Lock, Search, ShoppingBag, Heart, ChevronRight } from "lucide-react";
import FoundingBadge from "@/components/loopgate/FoundingBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
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

function ShopNav({ spendableIndex, navigate }: { spendableIndex: number; navigate: (p: string) => void }) {
  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-2xl border-b border-border/5">
      <div className="flex items-center justify-between px-5 h-14">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate("/hub")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-foreground" />
            <span className="font-display text-base tracking-wide text-foreground uppercase">Shop</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden sm:flex items-center gap-5 text-sm font-semibold">
            <span className="text-foreground cursor-pointer">Featured</span>
            <span className="text-muted-foreground/40 cursor-pointer hover:text-muted-foreground/60 transition-colors">Browse</span>
            <span className="text-muted-foreground/40 cursor-pointer hover:text-muted-foreground/60 transition-colors">Exclusives</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search the shop"
              className="bg-muted/10 border border-border/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/30 w-[180px] focus:outline-none focus:border-border/30 transition-colors"
            />
          </div>
          <button className="sm:hidden text-muted-foreground/50 hover:text-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="text-muted-foreground/50 hover:text-foreground transition-colors">
            <Heart className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 bg-muted/10 border border-border/10 rounded-full px-3 py-1.5">
            <Coins className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold tabular-nums text-foreground">{spendableIndex}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroBanner({
  ogItem,
  ogOwned,
  ogExpired,
  ogTimeLeft,
  claiming,
  onClaim,
}: {
  ogItem: ShopItem;
  ogOwned: boolean;
  ogExpired: boolean;
  ogTimeLeft: string | null;
  claiming: string | null;
  onClaim: (item: ShopItem) => void;
}) {
  return (
    <button
      onClick={() => !ogOwned && !ogExpired && onClaim(ogItem)}
      disabled={ogOwned || ogExpired || claiming === ogItem.id}
      className={cn(
        "w-full relative overflow-hidden group text-left transition-transform duration-200",
        !ogOwned && !ogExpired && "active:scale-[0.995] cursor-pointer"
      )}
    >
      {/* Full-bleed gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-background to-muted/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.06),transparent_60%)]" />

      <div className="relative px-6 sm:px-12 py-10 sm:py-16 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10 min-h-[220px] sm:min-h-[280px]">
        {/* Large centered icon */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className={cn(
            "w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center",
            ogOwned ? "bg-gold/5 border border-gold/20" : "bg-muted/10 border border-gold/10"
          )}>
            {ogOwned ? (
              <div className="flex flex-col items-center gap-2">
                <FoundingBadge size="md" animate={false} />
                <Check className="w-5 h-5 text-accent" />
              </div>
            ) : (
              <FoundingBadge size="md" animate />
            )}
          </div>
        </div>

        {/* Text content */}
        <div className="flex flex-col items-center sm:items-start gap-3 flex-1">
          <div>
            <h1 className="font-display text-3xl sm:text-5xl tracking-tight text-foreground leading-none">
              First Circle
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              {ogItem.description || "The OG badge. Only for the earliest Loopgate members. Claim it before it's gone forever."}
            </p>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {ogOwned ? (
              <span className="font-semibold text-accent">In your collection</span>
            ) : ogExpired ? (
              <span className="font-semibold text-muted-foreground">No longer available</span>
            ) : (
              <>
                <span className="font-bold text-foreground">FREE</span>
                <span className="text-muted-foreground/20">·</span>
                <span className="text-muted-foreground tabular-nums">{ogItem.total_claimed} claimed</span>
                {ogTimeLeft && (
                  <>
                    <span className="text-muted-foreground/20">·</span>
                    <span className="flex items-center gap-1 font-semibold text-destructive">
                      <Clock className="w-3 h-3" />
                      {ogTimeLeft}
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          {/* CTA */}
          {!ogOwned && !ogExpired && (
            <div className={cn(
              "mt-2 bg-foreground text-background text-sm font-bold px-7 py-2.5 rounded-full transition-all inline-block",
              claiming === ogItem.id ? "opacity-50" : "group-hover:opacity-90"
            )}>
              {claiming === ogItem.id ? "Claiming..." : "Claim OG Badge"}
            </div>
          )}
        </div>

        {/* Limited badge */}
        {!ogOwned && !ogExpired && (
          <div className="absolute top-5 right-5 sm:top-8 sm:right-8">
            <span className="bg-destructive/90 text-destructive-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
              Limited
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function ItemCard({ label, price }: { label: string; price?: string }) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-square rounded-2xl bg-muted/8 border border-border/8 flex items-center justify-center mb-3 transition-all group-hover:border-border/20 group-hover:bg-muted/12">
        <Lock className="w-5 h-5 text-muted-foreground/15 group-hover:text-muted-foreground/25 transition-colors" />
      </div>
      <p className="text-sm font-semibold text-foreground/80 truncate">{label}</p>
      {price && (
        <p className="text-xs text-muted-foreground/50 mt-0.5 flex items-center gap-1">
          <Coins className="w-3 h-3" />
          {price}
        </p>
      )}
    </div>
  );
}

function CollectionBanner({ title, subtitle, gradient }: { title: string; subtitle: string; gradient: string }) {
  return (
    <div className={cn(
      "rounded-2xl overflow-hidden relative group cursor-pointer transition-transform duration-200 active:scale-[0.98]",
      gradient
    )}>
      <div className="p-6 sm:p-8 flex flex-col justify-end min-h-[160px] sm:min-h-[200px]">
        <h3 className="font-display text-xl sm:text-2xl tracking-tight text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-foreground/60 mt-1">{subtitle}</p>
        <div className="mt-4 bg-foreground text-background text-xs font-bold px-5 py-2 rounded-full inline-block w-fit transition-opacity group-hover:opacity-90">
          Take me there
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [purchases, setPurchases] = useState<Set<string>>(new Set());
  const [spendableIndex, setSpendableIndex] = useState(0);
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
    toast.success(`${item.name} claimed!`);
    setPurchases((prev) => new Set([...prev, item.id]));
    setSpendableIndex((prev) => prev - item.price);
    setClaiming(null);
  };

  const ogItem = items.find(i => i.name === "OG Claim");
  const ogOwned = ogItem ? purchases.has(ogItem.id) : false;
  const ogExpired = ogItem?.available_until ? new Date(ogItem.available_until) < new Date() : false;
  const ogTimeLeft = ogItem?.available_until ? getTimeRemaining(ogItem.available_until) : null;

  const comingSoonItems = [
    { label: "???", price: "???" },
    { label: "???", price: "???" },
    { label: "???", price: "???" },
    { label: "???", price: "???" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <ShopNav spendableIndex={spendableIndex} navigate={navigate} />

      {loading ? (
        <div className="space-y-0">
          <div className="h-[280px] bg-muted/5 animate-pulse" />
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i}>
                <div className="aspect-square rounded-2xl bg-muted/5 animate-pulse mb-3" />
                <div className="h-3 w-20 bg-muted/5 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Hero Banner — full width, no padding */}
          {ogItem && (
            <HeroBanner
              ogItem={ogItem}
              ogOwned={ogOwned}
              ogExpired={ogExpired}
              ogTimeLeft={ogTimeLeft}
              claiming={claiming}
              onClaim={handleClaim}
            />
          )}

          {/* Item Grid */}
          <div className="px-5 sm:px-8 mt-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg sm:text-xl tracking-tight text-foreground">
                Coming Soon
              </h2>
              <button className="flex items-center gap-1 text-xs font-semibold text-muted-foreground/50 hover:text-foreground transition-colors">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {comingSoonItems.map((item) => (
                <ItemCard key={item.label} label={item.label} price={item.price} />
              ))}
            </div>
          </div>

          {/* Collection Banners */}
          <div className="px-5 sm:px-8 mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <CollectionBanner
              title="Cosmetics"
              subtitle="Avatar decorations, frames & effects"
              gradient="bg-gradient-to-br from-primary/10 via-muted/8 to-background"
            />
            <CollectionBanner
              title="Prestige"
              subtitle="Profile skins, nameplates & banners"
              gradient="bg-gradient-to-br from-accent/10 via-muted/8 to-background"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
