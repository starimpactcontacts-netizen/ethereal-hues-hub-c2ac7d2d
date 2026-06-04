import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Check, ShoppingBag, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import RingsCoin from "@/components/loopgate/RingsCoin";
import AuraUsername, { AURA_CFG, type AuraSlug } from "@/components/loopgate/AuraUsername";

const TEKO = { fontFamily: "Teko, sans-serif" };

const RARITY_CFG: Record<string, { label: string; color: string; stars: number; glowColor: string }> = {
  common:    { label: "COMMON",    color: "#71717a", stars: 1, glowColor: "rgba(113,113,122,0.35)" },
  uncommon:  { label: "UNCOMMON",  color: "#22c55e", stars: 2, glowColor: "rgba(34,197,94,0.35)"   },
  rare:      { label: "RARE",      color: "#38bdf8", stars: 3, glowColor: "rgba(56,189,248,0.4)"   },
  epic:      { label: "EPIC",      color: "#c084fc", stars: 4, glowColor: "rgba(192,132,252,0.4)"  },
  legendary: { label: "LEGENDARY", color: "#fbbf24", stars: 5, glowColor: "rgba(251,191,36,0.4)"  },
  mythic:    { label: "MYTHIC",    color: "#f472b6", stars: 5, glowColor: "rgba(244,114,182,0.45)" },
};

// Per-aura hero glow bg for the preview panel
const AURA_BG: Record<string, string> = {
  specter:   "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(30,110,220,0.28) 0%, rgba(0,20,60,0.15) 60%, transparent 100%)",
  hellfire:  "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(200,40,0,0.32) 0%, rgba(60,5,0,0.18) 60%, transparent 100%)",
  sovereign: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(200,150,0,0.28) 0%, rgba(50,30,0,0.15) 60%, transparent 100%)",
};

interface ShopItem {
  id: string; name: string; description: string | null;
  category: string; price: number; rarity: string; is_active: boolean;
}
interface OwnedMap { [itemId: string]: boolean }

export default function ShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [owned, setOwned] = useState<OwnedMap>({});
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [rings, setRings] = useState(0);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      const { data: shopData } = await supabase
        .from("shop_items").select("id, name, description, category, price, rarity, is_active")
        .eq("is_active", true).eq("category", "aura").order("price", { ascending: true });
      if (shopData) setItems(shopData as ShopItem[]);
      if (user) {
        const { data: purchaseData } = await supabase.from("shop_purchases").select("item_id").eq("user_id", user.id);
        if (purchaseData) {
          const map: OwnedMap = {};
          purchaseData.forEach((p: any) => { map[p.item_id] = true; });
          setOwned(map);
        }
        const { data: profileData } = await supabase.from("profiles").select("rings").eq("id", user.id).single();
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
    const { error: deductErr } = await supabase.rpc("deduct_rings" as any, { p_user_id: user.id, p_amount: item.price });
    if (deductErr) {
      const { error: updateErr } = await supabase.from("profiles").update({ rings: rings - item.price } as any).eq("id", user.id);
      if (updateErr) { toast.error("Purchase failed"); setBuying(null); return; }
    }
    const { error: buyErr } = await supabase.from("shop_purchases").insert({ user_id: user.id, item_id: item.id });
    if (buyErr) { toast.error("Purchase failed"); }
    else { setOwned((o) => ({ ...o, [item.id]: true })); setRings((r) => r - item.price); toast.success(`${item.name} unlocked!`); }
    setBuying(null);
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "linear-gradient(180deg, #080810 0%, #050508 100%)" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 flex items-center justify-between"
        style={{ background: "rgba(8,8,16,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingTop: "calc(env(safe-area-inset-top,0px) + 10px)", paddingBottom: 10 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <span style={{ ...TEKO, fontSize: 24, fontWeight: 900, letterSpacing: "0.18em", color: "#fff" }}>SHOP</span>
        {user ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "rgba(255,208,96,0.1)", border: "1px solid rgba(255,208,96,0.25)" }}>
            <RingsCoin size={14} />
            <span style={{ ...TEKO, fontSize: 16, fontWeight: 900, color: "#FFD060" }}>{rings.toLocaleString()}</span>
          </div>
        ) : <div className="w-16" />}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="px-4 pt-6 space-y-5">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))" }} />
            <span style={{ ...TEKO, fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.35)" }}>AURAS</span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)" }} />
          </div>
          <p className="text-center text-[11px] text-zinc-500 -mt-2 mb-4">
            Equip an aura — your name glows everywhere: hub, profile, battle chat.
          </p>

          {items.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-3">
              <ShoppingBag className="w-10 h-10 text-zinc-700" strokeWidth={1.5} />
              <p className="text-zinc-600 text-sm">No items available</p>
            </div>
          )}

          {items.map((item, i) => (
            <AuraCard key={item.id} item={item} owned={!!owned[item.id]} rings={rings}
              buying={buying === item.id} onBuy={() => handleBuy(item)} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function AuraCard({ item, owned, rings, buying, onBuy, index }: {
  item: ShopItem; owned: boolean; rings: number; buying: boolean; onBuy: () => void; index: number;
}) {
  const rarity = RARITY_CFG[item.rarity] || RARITY_CFG.common;
  const auraSlug = item.name.toLowerCase() as AuraSlug;
  const auraCfg = AURA_CFG[auraSlug];
  const canAfford = rings >= item.price;
  const heroBg = AURA_BG[auraSlug] || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      whileTap={{ scale: 0.985 }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "#0c0c14",
        border: `1px solid ${rarity.color}40`,
        boxShadow: owned
          ? `0 0 0 1px ${rarity.color}60, 0 8px 40px ${rarity.glowColor}`
          : `0 4px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {/* ── Hero preview panel ── */}
      <div className="relative flex flex-col items-center justify-center py-10 px-6 overflow-hidden"
        style={{ background: "#090910", minHeight: 160 }}>
        {/* Aura-colored radial glow bg */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: heroBg }} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        {/* Rarity top bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${rarity.color}, transparent)` }} />

        {/* Big animated aura name */}
        {auraCfg ? (
          <AuraUsername
            username={item.name}
            aura={auraSlug}
            style={{ ...TEKO, fontSize: 52, fontWeight: auraCfg.fontWeight ?? 900, letterSpacing: "0.08em", lineHeight: 1 } as React.CSSProperties}
          />
        ) : (
          <span style={{ ...TEKO, fontSize: 52, fontWeight: 900, letterSpacing: "0.08em", color: rarity.color }}>{item.name}</span>
        )}

        {/* Rarity stars */}
        <div className="flex items-center gap-1 mt-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: i < rarity.stars ? rarity.color : "rgba(255,255,255,0.08)", boxShadow: i < rarity.stars ? `0 0 6px ${rarity.color}` : "none" }} />
          ))}
        </div>

        {/* Rarity label */}
        <span className="mt-2 text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: rarity.color }}>
          {rarity.label}
        </span>

        {/* Owned checkmark overlay */}
        {owned && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.5)" }}>
            <Check className="w-3.5 h-3.5 text-green-400" />
          </div>
        )}
      </div>

      {/* ── Info + CTA panel ── */}
      <div className="px-4 py-4">
        {/* Description */}
        {item.description && (
          <p className="text-[12px] text-zinc-400 leading-relaxed mb-4">{item.description}</p>
        )}

        {/* Preview row */}
        {auraCfg && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest shrink-0">Your name</span>
            <AuraUsername
              username="YOURNAME"
              aura={auraSlug}
              style={{ ...TEKO, fontSize: 18, fontWeight: 900, letterSpacing: "0.08em" } as React.CSSProperties}
            />
          </div>
        )}

        {/* Buy row */}
        <div className="flex items-center justify-between gap-3">
          {/* Price */}
          <div className="flex items-center gap-1.5">
            {owned ? (
              <span className="text-[11px] text-green-400 font-bold tracking-wider">OWNED</span>
            ) : (
              <>
                <RingsCoin size={16} />
                <span style={{ ...TEKO, fontSize: 22, fontWeight: 900, color: canAfford ? "#FFD060" : "#52525b", lineHeight: 1 }}>
                  {item.price.toLocaleString()}
                </span>
              </>
            )}
          </div>

          {/* CTA button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBuy}
            disabled={buying || (!owned && !canAfford)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[13px] tracking-widest uppercase transition-all disabled:opacity-40"
            style={owned
              ? { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#4ade80" }
              : canAfford
                ? { background: `linear-gradient(135deg, ${rarity.color}33, ${rarity.color}55)`, border: `1px solid ${rarity.color}80`, color: "#fff", boxShadow: `0 4px 20px ${rarity.glowColor}` }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#52525b" }
            }
          >
            {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : owned ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            {buying ? "..." : owned ? "Equipped →" : "Buy Now"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
