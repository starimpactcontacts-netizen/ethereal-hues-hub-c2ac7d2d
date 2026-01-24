import { Construction, Sparkles, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import loopgateLogo from "@/assets/loopgate-logo.png";

export default function ShopPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      {/* Logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 w-32 h-16 blur-[30px] bg-white/30 rounded-full -z-10" />
        <img src={loopgateLogo} alt="LOOPGATE" className="h-12" />
      </div>

      {/* Maintenance card */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 max-w-md">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
          <Construction className="w-8 h-8 text-gold" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Shop Under Maintenance
        </h1>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          We're restocking with a fresh batch of items. The shop will be back soon with new rewards to redeem.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
          <Clock className="w-4 h-4" />
          <span>Check back later</span>
        </div>

        <Button 
          onClick={() => navigate('/hub')}
          className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
        >
          Back to Hub
        </Button>
      </div>

      {/* Decorative sparkles */}
      <div className="flex items-center gap-2 mt-8 text-muted-foreground/50">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs">New items coming soon</span>
        <Sparkles className="w-4 h-4" />
      </div>
    </div>
  );
}
