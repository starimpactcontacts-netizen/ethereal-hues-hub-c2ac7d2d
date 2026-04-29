import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShoppingBag } from "lucide-react";

export default function ShopPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black text-foreground flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 border-b border-white/5"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          paddingBottom: "8px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <span className="font-display text-base tracking-[0.18em] uppercase text-white/80">
          Shop
        </span>
        <div className="w-12" />
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center mb-6">
          <ShoppingBag className="w-9 h-9 text-white/40" strokeWidth={1.5} />
        </div>

        <div className="text-[10px] font-bold tracking-[0.32em] uppercase text-white/40 mb-3">
          Under Maintenance
        </div>

        <h1 className="font-display text-4xl tracking-tight text-white mb-3">
          Coming Soon
        </h1>

        <p className="text-sm text-white/50 max-w-xs leading-relaxed">
          The Shop is being rebuilt. Check back soon for cosmetics, prestige items, and exclusive drops.
        </p>

        <button
          onClick={() => navigate("/hub")}
          className="mt-10 px-8 py-3 rounded-md bg-white text-black text-xs font-bold tracking-[0.2em] uppercase hover:bg-white/90 transition-colors"
        >
          Back to Hub
        </button>
      </div>
    </div>
  );
}
