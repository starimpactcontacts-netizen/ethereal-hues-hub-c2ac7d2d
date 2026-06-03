import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Check, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import RingsCoin from "@/components/loopgate/RingsCoin";
import AuraUsername, { AuraPill, AURA_CFG, type AuraSlug } from "@/components/loopgate/AuraUsername";

const TEKO = { fontFamily: "Teko, sans-serif" };

const RARITY_CFG: Record<string, { label: string; color: string; glow: string }> = {
  common:    { label: "COMMON",    color: "#71717a", glow: "rgba(113,113,122,0.2)"  },
  uncommon:  { label: "UNCOMMON",  color: "#22c55e", glow: "rgba(34,197,94,0.2)"    },
  rare:      { label: "RARE",      color: "#3b82f6", glow: "rgba(59,130,246,0.25)"  },
  epic:      { label: "EPIC",      color: "#a855f7", glow: "rgba(168,85,247,0.25)"  },
  legendary: { label: "LEGENDARY", color: "#f59e0b", glow: "rgba(245,158,11,0.25)" },
  mythic:    { label: "MYTHIC",    color: "#ec4899", glow: "rgba(236,72,153,0.3)"   },
};

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  rarity: string;
  is_active: boolean;
}

interface OwnedMap { [itemId: string]: boolean }

export default function ShopPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<OwnedMap>({});
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [rings, setRings] = useState<number>(0);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      const { data: shopData } = await supabase
        .from("shop_items")
        .select("id, name, description, category, price, rarity, is_active")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (shopData) setItems(shopData as ShopItem[]);

      if (user) {
        const { data: purchaseData } = await supabase
          .from("shop_purchases")
          .select("item_id")
          .eq("user_id", user.id);
        if (purchaseData) {
          const map: OwnedMap = {};
          purchaseData.forEach((p: any) => { map[p.item_id] = true; });
          setOwned(map);
        }
        const { data: profileData } = await supabase
          .from("profiles")
          .select("rings")
          .eq("id", user.id)
          .single();
        if (profileData) setRings((profileData as any).rings ?? 0);
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
    const { error: deductErr } = await supabase.rpc("deduct_rings" as any, {
      p_user_id: user.id,
      p_amount: item.price,
    });

    // Fallback: manual deduct if RPC doesn't exist
    if (deductErr) {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ rings: rings - item.price } as any)
        .eq("id", user.id);
      if (updateErr) { toast.error("Purchase failed"); setBuying(null); return; }
    }

    const { error: buyErr } = await supabase
      .from("shop_purchases")
      .insert({ user_id: user.id, item_id: item.id });

    if (buyErr) {
      toast.error("Purchase failed");
    } else {
      setOwned((o) => ({ ...o, [item.id]: true }));
      setRings((r) => r - item.price);
      toast.success(`${item.name} unlocked! Head to Inventory to equip it.`);
    }
    setBuying(null);
  };

  // Group items by category
  const auras = items.filter((i) => i.category === "aura");
  const other = items.filter((i) => i.category !== "aura");

  return (
    <div className="min-h-screen pb-24" style={{ background: "#080808", color: "#fff" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-4"
        style={{
          background: "#080808",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          paddingBottom: "10px",
        }}
      >
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <span style={{ ...TEKO, fontSize: 22, fontWeight: 900, letterSpacing: "0.12em" }}>SHOP</span>
        {user ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RingsCoin size={14} />
            <span style={{ ...TEKO, fontSize: 15, fontWeight: 900, color: "#FFD060" }}>{rings.toLocaleString()}</span>
          </div>
        ) : <div className="w-12" />}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="px-4 py-5 space-y-8">

          {/* ── AURAS section ── */}
          {auras.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span style={{ ...TEKO, fontSize: 11, fontWeight: 900, letterSpacing: "0.28em", color: "rgba(255,255,255,0.3)" }}>AURAS</span>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
              <p className="text-[11px] text-zinc-500 mb-4 text-center leading-relaxed">
                Equip an aura to make your name glow on the battle scoreboard and your profile.
              </p>
              <div className="space-y-3">
                {auras.map((item) => (
                  <AuraCard
                    key={item.id}
                    item={item}
                    owned={!!owned[item.id]}
                    rings={rings}
                    buying={buying === item.id}
                    onBuy={() => handleBuy(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Other items ── */}
          {other.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span style={{ ...TEKO, fontSize: 11, fontWeight: 900, letterSpacing: "0.28em", color: "rgba(255,255,255,0.3)" }}>ITEMS</span>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
              <div className="space-y-3">
                {other.map((item) => (
                  <GenericCard
                    key={item.id}
                    item={item}
                    owned={!!owned[item.id]}
                    rings={rings}
                    buying={buying === item.id}
                    onBuy={() => handleBuy(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <ShoppingBag className="w-10 h-10 text-zinc-700" strokeWidth={1.5} />
              <p className="text-zinc-600 text-sm">No items available right now</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Aura card ─────────────────────────────────────────────────────────────────
function AuraCard({ item, owned, rings, buying, onBuy }: {
  item: ShopItem; owned: boolean; rings: number; buying: boolean; onBuy: () => void;
}) {
  const rarity = RARITY_CFG[item.rarity] || RARITY_CFG.common;
  const auraSlug = item.name.toLowerCase() as AuraSlug;
  const auraCfg = AURA_CFG[auraSlug];
  const canAfford = rings >= item.price;

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      className="relative overflow-hidden"
      style={{
        background: "#0e0e0e",
        border: `1px solid ${rarity.color}33`,
        boxShadow: owned ? `0 0 18px ${rarity.glow}` : "none",
      }}
    >
      {/* Rarity top edge */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: rarity.color, opacity: 0.7 }} />

      <div className="p-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Animated name preview */}
            <div className="flex items-center gap-2 mb-1">
              <AuraUsername
                username={item.name}
                aura={auraSlug}
                style={{ ...TEKO, fontSize: 28, fontWeight: 900, letterSpacing: "0.06em", lineHeight: 1 } as React.CSSProperties}
              />
              <AuraPill aura={auraSlug} />
            </div>

            {/* Rarity badge */}
            <span className="inline-block text-[9px] font-black tracking-[0.18em] uppercase mb-2" style={{ color: rarity.color }}>
              {rarity.label}
            </span>

            {/* Description */}
            {item.description && (
              <p className="text-[11px] text-zinc-500 leading-relaxed">{item.description}</p>
            )}

            {/* Live preview of what your name looks like */}
            {auraCfg && (
              <div className="mt-3 px-3 py-2 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[9px] text-zinc-600 uppercase tracking-widest shrink-0">Preview</span>
                <AuraUsername
                  username="YOURNAME"
                  aura={auraSlug}
                  style={{ ...TEKO, fontSize: 16, fontWeight: 900, letterSpacing: "0.08em" } as React.CSSProperties}
                />
              </div>
            )}
          </div>

          {/* Buy / Owned button */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            {!owned && (
              <div className="flex items-center gap-1">
                <RingsCoin size={13} />
                <span style={{ ...TEKO, fontSize: 16, fontWeight: 900, color: canAfford ? "#FFD060" : "#71717a" }}>
                  {item.price.toLocaleString()}
                </span>
              </div>
            )}
            <button
              onClick={onBuy}
              disabled={buying || (!owned && !canAfford)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
              style={{
                background: owned ? "rgba(34,197,94,0.12)" : canAfford ? rarity.color + "22" : "rgba(255,255,255,0.04)",
                border: `1px solid ${owned ? "rgba(34,197,94,0.4)" : canAfford ? rarity.color + "55" : "rgba(255,255,255,0.08)"}`,
                color: owned ? "#22c55e" : canAfford ? rarity.color : "#71717a",
              }}
            >
              {buying ? <Loader2 className="w-3 h-3 animate-spin" /> : owned ? <Check className="w-3 h-3" /> : null}
              {buying ? "..." : owned ? "OWNED" : "BUY"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Generic item card ─────────────────────────────────────────────────────────
function GenericCard({ item, owned, rings, buying, onBuy }: {
  item: ShopItem; owned: boolean; rings: number; buying: boolean; onBuy: () => void;
}) {
  const rarity = RARITY_CFG[item.rarity] || RARITY_CFG.common;
  const canAfford = rings >= item.price;

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      className="relative overflow-hidden p-4"
      style={{ background: "#0e0e0e", border: `1px solid ${rarity.color}33` }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: rarity.color, opacity: 0.6 }} />
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex-1 min-w-0">
          <p className="font-black tracking-wide text-white text-sm mb-0.5">{item.name}</p>
          <span className="text-[9px] font-black tracking-[0.18em] uppercase mb-2 block" style={{ color: rarity.color }}>{rarity.label}</span>
          {item.description && <p className="text-[11px] text-zinc-500 leading-relaxed">{item.description}</p>}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          {!owned && (
            <div className="flex items-center gap-1">
              <RingsCoin size={13} />
              <span style={{ ...TEKO, fontSize: 16, fontWeight: 900, color: canAfford ? "#FFD060" : "#71717a" }}>
                {item.price.toLocaleString()}
              </span>
            </div>
          )}
          <button
            onClick={onBuy}
            disabled={buying || (!owned && !canAfford)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-40"
            style={{
              background: owned ? "rgba(34,197,94,0.12)" : canAfford ? rarity.color + "22" : "rgba(255,255,255,0.04)",
              border: `1px solid ${owned ? "rgba(34,197,94,0.4)" : canAfford ? rarity.color + "55" : "rgba(255,255,255,0.08)"}`,
              color: owned ? "#22c55e" : canAfford ? rarity.color : "#71717a",
            }}
          >
            {buying ? <Loader2 className="w-3 h-3 animate-spin" /> : owned ? <Check className="w-3 h-3" /> : null}
            {buying ? "..." : owned ? "OWNED" : "BUY"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
