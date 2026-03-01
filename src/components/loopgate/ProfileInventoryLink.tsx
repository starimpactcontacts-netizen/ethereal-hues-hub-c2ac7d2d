import { Package, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfileInventoryLink({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="px-4 mb-2">
      <button
        onClick={() => navigate("/inventory")}
        className="w-full bg-surface-1 border border-border rounded-md p-2.5 flex items-center gap-3 hover:border-foreground/30 transition-colors group"
      >
        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[11px] font-semibold text-foreground">My Items</p>
          <p className="text-[9px] text-muted-foreground">Equip badges, skins & cosmetics</p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>
    </div>
  );
}
