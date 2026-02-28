import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Clock, Coins, Check, ChevronLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import ogClaimImg from "@/assets/shop/og-claim.jpg";

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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/hub")} className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Hub
          </button>
          <div className="flex items-center gap-2 bg-surface-1 border border-border rounded-full px-3.5 py-1.5">
            <Coins className="w-3.5 h-3.5 text-gold" />
            <span className="text-sm font-bold tabular-nums text-foreground">{spendableIndex}</span>
          </div>
        </div>

        <h1 className="font-display text-3xl tracking-wide text-foreground">SHOP</h1>
        <p className="text-xs text-muted-foreground mt-0.5 mb-6">Exclusive cosmetics & collectibles</p>
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-surface-1 rounded-2xl animate-pulse" />
          </div>
        ) : !ogItem ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm">Nothing available right now. Check back soon.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Featured Item Card */}
            <div className="relative rounded-2xl overflow-hidden border border-gold/25 shadow-[0_0_40px_-10px_hsl(var(--gold)/0.2)]">
              {/* Image */}
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={ogClaimImg}
                  alt="OG Claim"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                  <div className="flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    Limited
                  </div>
                  <Crown className="w-5 h-5 text-gold drop-shadow-lg" />
                </div>

                {/* Bottom overlay info */}
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gold/80 font-semibold mb-1">
                    Exclusive Badge
                  </div>
                  <h2 className="font-display text-3xl tracking-wide text-white mb-1.5">
                    OG CLAIM
                  </h2>
                  <p className="text-[13px] text-white/60 leading-relaxed max-w-[280px]">
                    {ogItem.description}
                  </p>
                </div>
              </div>

              {/* Action Area */}
              <div className="p-4 bg-surface-0 border-t border-border/40">
                {/* Countdown */}
                {ogTimeLeft && !ogOwned && !ogExpired && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Disappears in</span>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-red-400">
                      <Clock className="w-3.5 h-3.5" />
                      {ogTimeLeft}
                    </div>
                  </div>
                )}

                {/* Claimed count */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Claimed by</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">{ogItem.total_claimed} editors</span>
                </div>

                <div className="h-px bg-border/40 mb-3" />

                {/* Price + CTA */}
                {ogOwned ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-semibold text-sm">
                    <Check className="w-4 h-4" />
                    In Your Collection
                  </div>
                ) : ogExpired ? (
                  <div className="text-center py-2.5 text-muted-foreground text-sm font-medium">
                    No longer available
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-muted-foreground font-medium">Price:</span>
                      <span className="font-bold text-gold">FREE</span>
                    </div>
                    <Button
                      onClick={() => handleClaim(ogItem)}
                      disabled={claiming === ogItem.id}
                      className="flex-1 bg-gold hover:bg-gold/90 text-black font-bold h-11 text-sm rounded-xl"
                    >
                      {claiming === ogItem.id ? "Claiming..." : "Claim Now"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Coming Soon teaser */}
            <div className="text-center py-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Coming Soon</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <p className="text-xs text-muted-foreground/50">
                Avatar Decorations · Profile Effects · Nameplates
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
