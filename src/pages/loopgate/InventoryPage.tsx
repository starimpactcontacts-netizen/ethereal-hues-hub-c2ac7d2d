import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Package, ShoppingBag, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import FoundingBadge from "@/components/loopgate/FoundingBadge";

interface OwnedItem {
  id: string;
  item_id: string;
  purchased_at: string;
  is_equipped: boolean;
  item: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    item_type: string;
    image_url: string | null;
  } | null;
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<OwnedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("shop_purchases")
      .select("id, item_id, purchased_at, is_equipped, shop_items(id, name, description, category, item_type, image_url)")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false });

    if (data) {
      setItems(
        (data as any[]).map((d) => ({
          id: d.id,
          item_id: d.item_id,
          purchased_at: d.purchased_at,
          is_equipped: d.is_equipped ?? false,
          item: d.shop_items,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const toggleEquip = async (purchase: OwnedItem) => {
    if (!user) return;
    setToggling(purchase.id);
    const newState = !purchase.is_equipped;

    const { error } = await supabase
      .from("shop_purchases")
      .update({ is_equipped: newState } as any)
      .eq("id", purchase.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(newState ? "Equipped!" : "Unequipped");
      setItems((prev) =>
        prev.map((i) => (i.id === purchase.id ? { ...i, is_equipped: newState } : i))
      );

      // Sync is_founding_member on profile when toggling OG Claim
      if (purchase.item.name === "OG Claim") {
        await supabase
          .from("profiles")
          .update({ is_founding_member: newState } as any)
          .eq("id", user.id);
      }
    }
    setToggling(null);
  };

  const equipped = items.filter((i) => i.is_equipped);
  const unequipped = items.filter((i) => !i.is_equipped);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-2xl border-b border-border/5">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/profile")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-foreground" />
              <span className="font-display text-base tracking-wide text-foreground uppercase">
                Inventory
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Shop
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-5 pt-6 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted/8 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <div className="w-16 h-16 rounded-2xl bg-muted/10 border border-border/10 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-muted-foreground/20" />
          </div>
          <h2 className="font-display text-lg text-foreground mb-1">Nothing here yet</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Claim badges and skins from the Index Shop to see them here.
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="bg-foreground text-background text-sm font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Browse Shop
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="px-5 pt-5"
        >
          {/* Equipped Section */}
          {equipped.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Equipped
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {equipped.map((item) => (
                  <InventoryCard
                    key={item.id}
                    item={item}
                    toggling={toggling === item.id}
                    onToggle={() => toggleEquip(item)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Items / Unequipped */}
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              {equipped.length > 0 ? "Unequipped" : "All Items"}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(equipped.length > 0 ? unequipped : items).map((item) => (
                <InventoryCard
                  key={item.id}
                  item={item}
                  toggling={toggling === item.id}
                  onToggle={() => toggleEquip(item)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InventoryCard({
  item,
  toggling,
  onToggle,
}: {
  item: OwnedItem;
  toggling: boolean;
  onToggle: () => void;
}) {
  const isOG = item.item?.name === "OG Claim";
  const displayName = isOG ? "First Circle" : item.item?.name || "Item";
  const categoryLabel = item.item?.category === "badge" ? "Badge" : item.item?.category === "skin" ? "Skin" : item.item?.item_type || "Item";

  return (
    <motion.button
      onClick={onToggle}
      disabled={toggling}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "flex flex-col items-center text-center rounded-xl border p-3 transition-all relative overflow-hidden",
        item.is_equipped
          ? "bg-primary/5 border-primary/30"
          : "bg-surface-1 border-border hover:border-foreground/20"
      )}
    >
      {/* Equipped indicator */}
      {item.is_equipped && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-primary-foreground" />
        </div>
      )}

      {/* Item visual */}
      <div className="w-14 h-14 flex items-center justify-center mb-2">
        {isOG ? (
          <FoundingBadge size="md" animate={false} />
        ) : item.item?.image_url ? (
          <img
            src={item.item.image_url}
            alt={displayName}
            className="w-12 h-12 object-contain"
          />
        ) : (
          <Package className="w-6 h-6 text-muted-foreground/20" />
        )}
      </div>

      {/* Name */}
      <p className="text-[11px] font-semibold text-foreground truncate w-full">{displayName}</p>
      <p className="text-[9px] text-muted-foreground">{categoryLabel}</p>

      {/* Equip / Unequip label */}
      <span
        className={cn(
          "mt-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
          toggling && "opacity-50",
          item.is_equipped
            ? "bg-primary/10 text-primary"
            : "bg-muted/10 text-muted-foreground"
        )}
      >
        {toggling ? "..." : item.is_equipped ? "Unequip" : "Equip"}
      </span>
    </motion.button>
  );
}
