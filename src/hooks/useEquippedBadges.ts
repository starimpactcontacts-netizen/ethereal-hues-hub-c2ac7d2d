import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EquippedBadge {
  id: string;
  item_name: string;
  item_type: string;
  image_url: string | null;
}

export function useEquippedBadges(userId: string | undefined) {
  const [badges, setBadges] = useState<EquippedBadge[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("shop_purchases")
        .select("id, is_equipped, shop_items(id, name, item_type, image_url)")
        .eq("user_id", userId)
        .eq("is_equipped", true);

      if (data) {
        setBadges(
          (data as any[])
            .filter((d) => d.shop_items)
            .map((d) => ({
              id: d.id,
              item_name: d.shop_items.name,
              item_type: d.shop_items.item_type,
              image_url: d.shop_items.image_url,
            }))
        );
      }
    };

    fetch();
  }, [userId]);

  const hasEquippedOG = badges.some((b) => b.item_name === "OG Claim");

  return { badges, hasEquippedOG };
}
