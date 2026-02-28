import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Coins, Check, ChevronLeft, Lock, Crown, Sparkles } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/10">
        <div className="flex items-center justify-between px-4 h-11">
          <button
            onClick={() => navigate("/hub")}
            className="flex items-center gap-1 text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Hub
          </button>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-foreground">Featured</span>
            <span className="text-muted-foreground/40">Browse</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums text-foreground">
            <Coins className="w-3.5 h-3.5 text-primary" />
            {spendableIndex}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-4">
          <div className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="aspect-square rounded-xl bg-muted/20 animate-pulse" />)}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Hero banner ── */}
          {ogItem && (
            <div className="p-4 pb-0">
              <button
                onClick={() => !ogOwned && !ogExpired && handleClaim(ogItem)}
                disabled={ogOwned || ogExpired || claiming === ogItem.id}
                className={cn(
                  "w-full rounded-2xl relative overflow-hidden group transition-transform duration-200",
                  !ogOwned && !ogExpired && "active:scale-[0.985]"
                )}
              >
                {/* Gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/10" />
                <div className="absolute inset-0 rounded-2xl border border-border/20" />

                <div className="relative px-5 py-6 flex flex-col items-center text-center gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center",
                    ogOwned ? "bg-accent/10" : "bg-primary/10"
                  )}>
                    {ogOwned ? (
                      <Check className="w-8 h-8 text-accent" />
                    ) : (
                      <Crown className="w-8 h-8 text-primary" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="font-display text-xl tracking-wide text-foreground">OG CLAIM</h2>
                      {!ogOwned && !ogExpired && (
                        <span className="bg-destructive/90 text-destructive-foreground text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Limited
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto leading-relaxed">
                      {ogItem.description || "Exclusive badge for early members. Gone forever once the timer runs out."}
                    </p>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px]">
                    {ogOwned ? (
                      <span className="font-semibold text-accent">In your collection</span>
                    ) : ogExpired ? (
                      <span className="font-semibold text-muted-foreground">No longer available</span>
                    ) : (
                      <>
                        <span className="font-bold text-foreground">FREE</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-muted-foreground tabular-nums">{ogItem.total_claimed} claimed</span>
                        {ogTimeLeft && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
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
                      "mt-1 bg-foreground text-background text-xs font-bold uppercase tracking-wider px-8 py-2.5 rounded-full transition-opacity",
                      claiming === ogItem.id ? "opacity-50" : "group-hover:opacity-90"
                    )}>
                      {claiming === ogItem.id ? "Claiming..." : "Claim Now"}
                    </div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* ── Item Grid ── */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                Coming Soon
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {["Badge", "Avatar Frame", "Profile Effect", "Nameplate"].map((label) => (
                <div
                  key={label}
                  className="aspect-[4/3] rounded-xl bg-muted/8 border border-border/8 flex flex-col items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-muted-foreground/15" />
                  <span className="text-[10px] font-medium text-muted-foreground/20">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Collections promo ── */}
          <div className="px-4 mt-6 grid grid-cols-2 gap-2.5">
            {[
              { title: "Cosmetics", sub: "Avatar decorations & frames", icon: Sparkles },
              { title: "Prestige", sub: "Profile effects & nameplates", icon: Crown },
            ].map(({ title, sub, icon: Icon }) => (
              <div
                key={title}
                className="rounded-xl bg-muted/8 border border-border/8 p-4 flex flex-col justify-between aspect-[4/3]"
              >
                <Icon className="w-5 h-5 text-muted-foreground/20" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground/40">{title}</p>
                  <p className="text-[10px] text-muted-foreground/20 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
