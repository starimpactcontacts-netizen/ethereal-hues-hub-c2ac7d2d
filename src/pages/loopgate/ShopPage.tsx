import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Coins, Check, ChevronLeft, Lock, Sparkles } from "lucide-react";
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

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex-shrink-0 w-[140px] snap-start">
      <div className="aspect-square rounded-2xl border border-dashed border-border/30 bg-surface-1/30 flex flex-col items-center justify-center gap-2">
        <Lock className="w-4 h-4 text-muted-foreground/30" />
        <span className="text-[10px] text-muted-foreground/30 font-medium">{label}</span>
      </div>
      <div className="mt-2 px-0.5">
        <div className="h-2.5 w-16 bg-surface-1/40 rounded-full" />
        <div className="h-2 w-10 bg-surface-1/30 rounded-full mt-1.5" />
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

  const upcomingSlots = ["Avatar Frame", "Profile Skin", "Nameplate", "Banner", "Effect"];

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
          </div>
        </div>

        <h1 className="font-display text-2xl tracking-wide text-foreground">Shop</h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">Exclusive cosmetics & collectibles</p>
      </div>

      {/* Featured / Limited section */}
      <div className="mt-5">
        <div className="px-4 flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="text-xs font-semibold uppercase tracking-widest text-foreground/70">Limited</span>
          {ogTimeLeft && !ogOwned && !ogExpired && (
            <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-red-400">
              <Clock className="w-3 h-3" />
              {ogTimeLeft}
            </span>
          )}
        </div>

        {/* Carousel */}
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex gap-3 px-4 pb-2 snap-x snap-mandatory">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[140px] snap-start">
                  <div className="aspect-square rounded-2xl bg-surface-1 animate-pulse" />
                  <div className="mt-2 px-0.5">
                    <div className="h-2.5 w-16 bg-surface-1 rounded-full animate-pulse" />
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* OG Claim Card */}
                {ogItem && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-shrink-0 w-[140px] snap-start"
                  >
                    <button
                      onClick={() => !ogOwned && !ogExpired && handleClaim(ogItem)}
                      disabled={ogOwned || ogExpired || claiming === ogItem?.id}
                      className="w-full text-left group"
                    >
                      <div className={cn(
                        "aspect-square rounded-2xl border relative overflow-hidden flex items-center justify-center transition-all",
                        ogOwned
                          ? "border-green-500/30 bg-green-500/5"
                          : ogExpired
                            ? "border-border/20 bg-surface-1/30 opacity-50"
                            : "border-gold/30 bg-gradient-to-br from-gold/5 via-transparent to-gold/10 group-hover:border-gold/50 group-hover:shadow-[0_0_20px_-6px_hsl(var(--gold)/0.3)]"
                      )}>
                        {/* Badge visual */}
                        <div className={cn(
                          "w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-display font-bold tracking-tight",
                          ogOwned
                            ? "bg-green-500/10 text-green-400"
                            : "bg-gold/10 text-gold"
                        )}>
                          {ogOwned ? <Check className="w-7 h-7" /> : "OG"}
                        </div>

                        {/* Limited tag */}
                        {!ogOwned && !ogExpired && (
                          <div className="absolute top-2 right-2 bg-red-500/90 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md">
                            Ltd
                          </div>
                        )}

                        {/* Free tag */}
                        {!ogOwned && !ogExpired && (
                          <div className="absolute bottom-2 left-2 text-[9px] font-bold text-gold uppercase">
                            Free
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Label */}
                    <div className="mt-2 px-0.5">
                      <p className="text-[11px] font-semibold text-foreground truncate">OG Claim</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {ogOwned ? "Owned" : ogExpired ? "Expired" : `${ogItem.total_claimed} claimed`}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Empty slots */}
                {upcomingSlots.map((label) => (
                  <EmptySlot key={label} label={label} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Categories preview */}
      {["Badges", "Avatar Frames", "Profile Effects"].map((cat) => (
        <div key={cat} className="mt-8">
          <div className="px-4 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40">{cat}</span>
          </div>
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-3 px-4 pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[140px]">
                  <div className="aspect-square rounded-2xl border border-dashed border-border/20 bg-surface-1/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground/20" />
                  </div>
                  <div className="mt-2 px-0.5">
                    <div className="h-2.5 w-14 bg-surface-1/30 rounded-full" />
                    <div className="h-2 w-8 bg-surface-1/20 rounded-full mt-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
