import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, ChevronRight, Lock, Globe, Users, Crown, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LoopMonster from "@/components/loopgate/LoopMonster";

interface Arena {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  requiredLeague: "open" | "pro" | "elite" | null;
}

const arenas: Arena[] = [
  {
    id: 1,
    title: "Global Arena",
    description: "Chat with editors worldwide",
    icon: Globe,
    requiredLeague: null, // Open to all
  },
  {
    id: 2,
    title: "Open League Arena",
    description: "Connect with fellow competitors",
    icon: Users,
    requiredLeague: null, // Open to all
  },
  {
    id: 3,
    title: "Pro League Arena",
    description: "Exclusive to Pro League members",
    icon: Crown,
    requiredLeague: "pro",
  },
  {
    id: 4,
    title: "Elite Arena",
    description: "The inner circle of champions",
    icon: Shield,
    requiredLeague: "elite",
  },
];

export default function ArenasPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);

  const userLeague = profile?.league?.toLowerCase() || "open";

  const canAccessArena = (arena: Arena): boolean => {
    if (!arena.requiredLeague) return true;
    
    if (arena.requiredLeague === "pro") {
      return userLeague === "pro" || userLeague === "elite";
    }
    
    if (arena.requiredLeague === "elite") {
      return userLeague === "elite";
    }
    
    return true;
  };

  const handleArenaClick = (arena: Arena) => {
    if (canAccessArena(arena)) {
      navigate(`/arenas/${arena.id}`);
    } else {
      setLockedDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Loop Monster - appears on overscroll */}
      <LoopMonster />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-gold" />
            <h1 className="text-xl font-bold uppercase tracking-wider">Arenas</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Join the conversation
          </p>
        </div>
      </div>

      {/* Arena List */}
      <div className="p-4 space-y-3">
        {arenas.map((arena, index) => {
          const isLocked = !canAccessArena(arena);
          const Icon = arena.icon;

          return (
            <motion.button
              key={arena.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleArenaClick(arena)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                isLocked
                  ? "bg-muted/30 border-border/50 opacity-60"
                  : "bg-card border-border hover:border-gold/50 hover:bg-card/80"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isLocked ? "bg-muted" : "bg-gold/10"
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${isLocked ? "text-muted-foreground" : "text-gold"}`}
                />
              </div>

              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{arena.title}</span>
                  {isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">{arena.description}</p>
              </div>

              <ChevronRight
                className={`w-5 h-5 ${isLocked ? "text-muted-foreground" : "text-foreground"}`}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Locked Arena Dialog */}
      <Dialog open={lockedDialogOpen} onOpenChange={setLockedDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-gold" />
              Arena Locked
            </DialogTitle>
            <DialogDescription className="pt-2">
              Reach the required league to unlock this Arena. Keep competing and
              climbing the ranks to gain access to exclusive chat rooms.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setLockedDialogOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
