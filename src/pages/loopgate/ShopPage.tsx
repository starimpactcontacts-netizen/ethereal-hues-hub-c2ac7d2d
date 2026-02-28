import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Coins, Check, ChevronLeft, Lock, Crown } from "lucide-react";
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

/* ── Locked placeholder slot ── */
function LockedSlot() {
  return (
    <div className="flex-shrink-0 w-[120px] snap-start select-none">
      <div className="aspect-square rounded-xl bg-surface-1/40 border border-border/10 flex items-center justify-center">
        <Lock className="w-3.5 h-3.5 text-muted-foreground/15" />
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/10">
        <div className="flex items-center justify-between px-4 h-12">
          <button onClick={() => navigate("/hub")} className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="font-medium">Hub</span>
          </button>
          <span className="font-display text-base tracking-wide text-foreground absolute left-1/2 -translate-x-1/2">
            SHOP
          </span>
          <div className="flex items-center gap-1.5 bg-surface-1/60 border border-border/20 rounded-full px-2.5 py-1">
            <Coins className="w-3 h-3 text-gold" />
            <span className="text-xs font-bold tabular-nums text-foreground">{spendableIndex}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 pt-6 space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-3 w-20 bg-surface-1/50 rounded animate-pulse" />
              <div className="flex gap-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="w-[120px] aspect-square bg-surface-1/40 rounded-xl animate-pulse flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pt-4 space-y-6">

          {/* ── FEATURED: OG Claim hero banner ── */}
          {ogItem && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="px-4"
            >
              <button
                onClick={() => !ogOwned && !ogExpired && handleClaim(ogItem)}
                disabled={ogOwned || ogExpired || claiming === ogItem.id}
                className={cn(
                  "w-full rounded-2xl overflow-hidden relative group transition-all duration-300",
                  !ogOwned && !ogExpired && "active:scale-[0.98]"
                )}
              >
                {/* Background */}
                <div className={cn(
                  "absolute inset-0 transition-all duration-500",
                  ogOwned
                    ? "bg-gradient-to-br from-green-950/40 via-background to-green-950/20"
                    : "bg-gradient-to-br from-gold/8 via-background to-gold/4 group-hover:from-gold/12 group-hover:to-gold/8"
                )} />
                <div className={cn(
                  "absolute inset-0 rounded-2xl border transition-colors",
                  ogOwned ? "border-green-500/20" : "border-gold/15 group-hover:border-gold/30"
                )} />

                {/* Content */}
                <div className="relative flex items-center gap-4 p-4">
                  {/* Badge icon */}
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300",
                    !ogOwned && "group-hover:scale-105",
                    ogOwned
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-gold/10 border border-gold/20"
                  )}>
                    {ogOwned ? (
                      <Check className="w-6 h-6 text-green-400" />
                    ) : (
                      <Crown className="w-6 h-6 text-gold" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-display text-lg tracking-wide text-foreground">OG CLAIM</h3>
                      {!ogOwned && !ogExpired && (
                        <span className="bg-red-500/90 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">
                          Limited
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                      {ogItem.description || "Exclusive founder badge. Claim it before it's gone."}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {ogOwned ? (
                        <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Owned</span>
                      ) : ogExpired ? (
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Expired</span>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Free</span>
                          <span className="text-[10px] text-muted-foreground/60">·</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{ogItem.total_claimed} claimed</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side: timer or action */}
                  <div className="flex-shrink-0">
                    {ogOwned ? (
                      <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                    ) : ogExpired ? null : (
                      <div className="text-right">
                        {ogTimeLeft && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-red-400 mb-1">
                            <Clock className="w-2.5 h-2.5" />
                            {ogTimeLeft}
                          </div>
                        )}
                        <div className={cn(
                          "bg-gold text-black text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition-all",
                          claiming === ogItem.id ? "opacity-60" : "group-hover:bg-gold/90"
                        )}>
                          {claiming === ogItem.id ? "..." : "Claim"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          )}

          {/* ── Carousel sections ── */}
          {[
            { title: "Badges", delay: 0.1 },
            { title: "Avatar Frames", delay: 0.15 },
            { title: "Profile Effects", delay: 0.2 },
            { title: "Nameplates", delay: 0.25 },
          ].map(({ title, delay }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay, duration: 0.35 }}
            >
              <div className="flex items-center justify-between px-4 mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">{title}</span>
                <span className="text-[10px] text-muted-foreground/25 font-medium">Soon</span>
              </div>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-2.5 px-4 pb-1 snap-x snap-mandatory" style={{ paddingRight: 60 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <LockedSlot key={i} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
