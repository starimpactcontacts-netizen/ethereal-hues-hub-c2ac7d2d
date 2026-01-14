import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  ShoppingBag, 
  Crown, 
  Home, 
  Zap,
  HelpCircle
} from "lucide-react";

const guideSteps = [
  {
    icon: Trophy,
    title: "Enter Events",
    description: "Submit edits in active competitions.",
  },
  {
    icon: Target,
    title: "Earn QOI Scores",
    description: "Quality Of Impact: the metric that decides your influence.",
  },
  {
    icon: TrendingUp,
    title: "Climb the Index",
    description: "Higher QOI = more Index. Spend Index on cosmetics, digital rewards, physical gear.",
  },
  {
    icon: Crown,
    title: "Rise in Rank",
    description: "Win events → move up global rankings.",
  },
  {
    icon: Home,
    title: "Join a House",
    description: "Houses are identity groups. Prestige houses are invite-only.",
    optional: true,
  },
  {
    icon: Zap,
    title: "Level Up",
    description: "Your profile level increases through activity, streaks, and invites.",
  },
];

interface BeginnerGuideModalProps {
  trigger?: React.ReactNode;
}

export default function BeginnerGuideModal({ trigger }: BeginnerGuideModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <HelpCircle size={16} />
            <span>How It Works</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-background border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <span className="text-2xl font-bold tracking-tight">Welcome to</span>
            <br />
            <span className="text-3xl font-black tracking-[0.2em] text-gold">LOOPGATE</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-1">
          <p className="text-center text-muted-foreground text-sm mb-6">
            Here's how it works:
          </p>

          <div className="space-y-4">
            {guideSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <step.icon size={18} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                    {step.optional && (
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Optional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground/50 font-mono">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-6 text-center">
            <button
              onClick={() => setOpen(false)}
              className="px-6 py-2.5 bg-gold text-background font-semibold text-sm rounded-lg hover:bg-gold/90 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
