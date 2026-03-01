import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, Package, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FoundingBadge from "./FoundingBadge";
import { motion } from "framer-motion";

interface OwnedItem {
  id: string;
  item_id: string;
  purchased_at: string;
  item: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    item_type: string;
    image_url: string | null;
  } | null;
}

export default function ProfileInventory({ userId, navigate }: { userId: string; navigate: (p: string) => void }) {
  const [items, setItems] = useState<OwnedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("shop_purchases")
      .select("id, item_id, purchased_at, shop_items(id, name, description, category, item_type, image_url)")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false });

    if (data) {
      setItems(
        (data as any[]).map((d) => ({
          id: d.id,
          item_id: d.item_id,
          purchased_at: d.purchased_at,
          item: d.shop_items,
        }))
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const hasItems = items.length > 0;

  return (
    <div className="px-4 mb-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <Package className="w-3 h-3 text-muted-foreground" />
          <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">My Items</h2>
        </div>
        <button
          onClick={() => navigate("/shop")}
          className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Shop <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="flex gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="w-16 h-16 rounded-lg bg-muted/10 animate-pulse" />
          ))}
        </div>
      ) : !hasItems ? (
        <button
          onClick={() => navigate("/shop")}
          className="w-full bg-surface-1 border border-border border-dashed rounded-md p-3 flex items-center gap-3 hover:border-foreground/20 transition-colors group"
        >
          <div className="w-8 h-8 rounded bg-muted/20 flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold text-foreground/70">No items yet</p>
            <p className="text-[9px] text-muted-foreground">Visit the Index Shop to claim badges & skins</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
        </button>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {items.map((owned) => (
            <InventorySlot key={owned.id} owned={owned} />
          ))}
        </div>
      )}
    </div>
  );
}

function InventorySlot({ owned }: { owned: OwnedItem }) {
  const isOG = owned.item?.name === "OG Claim";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-shrink-0 w-16 group"
    >
      <div className="w-16 h-16 rounded-lg bg-surface-1 border border-border flex items-center justify-center relative overflow-hidden hover:border-foreground/20 transition-colors cursor-default">
        {isOG ? (
          <FoundingBadge size="md" animate={false} />
        ) : owned.item?.image_url ? (
          <img src={owned.item.image_url} alt={owned.item?.name || ""} className="w-10 h-10 object-contain" />
        ) : (
          <Package className="w-5 h-5 text-muted-foreground/30" />
        )}
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      </div>
      <p className="text-[8px] text-muted-foreground text-center mt-1 truncate">
        {isOG ? "First Circle" : owned.item?.name || "Item"}
      </p>
    </motion.div>
  );
}
