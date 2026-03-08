import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Trophy, BarChart3, Star, Bell, ChevronRight } from "lucide-react";
import GateIcon from '@/components/loopgate/GateIcon';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StudiosTeaserProps {
  variant?: "full" | "compact";
}

export default function StudiosTeaser({ variant = "full" }: StudiosTeaserProps) {
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNotify = async () => {
    if (!username.trim()) {
      toast.error("Please enter your username");
      return;
    }
    
    setSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success("You'll be notified when Studios launches!");
    setShowNotifyForm(false);
    setUsername("");
    setEmail("");
    setSubmitting(false);
  };

  const features = [
    { icon: Building2, label: "Official Studio Page" },
    { icon: Users, label: "Private Roster" },
    { icon: Trophy, label: "Studio Challenges" },
    { icon: Star, label: "Editor Recruitment" },
    { icon: BarChart3, label: "Analytics Dashboard" },
    { icon: Sparkles, label: "Premium Placement" },
  ];

  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-surface-1 via-background to-surface-1"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
        
        <div className="relative p-5">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400">Coming Soon</span>
          </div>
          <h3 className="font-display text-xl font-bold tracking-wide mb-2">STUDIOS</h3>
          <p className="text-xs text-muted-foreground mb-4">
            The professional tier of Loopgate for studios, brands & orgs.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNotifyForm(true)}
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <Bell className="w-3 h-3 mr-1.5" />
            Notify Me
          </Button>
        </div>

        {/* Notify Form Modal */}
        {showNotifyForm && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm p-5 flex flex-col justify-center">
            <button
              onClick={() => setShowNotifyForm(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h4 className="text-sm font-semibold mb-3">Get notified</h4>
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-surface-0 border border-border rounded-lg text-sm mb-2 focus:outline-none focus:border-purple-500/50"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-surface-0 border border-border rounded-lg text-sm mb-3 focus:outline-none focus:border-purple-500/50"
            />
            <Button
              size="sm"
              onClick={handleNotify}
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? "Submitting..." : "Notify Me"}
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/30"
    >
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-indigo-900/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(139,92,246,0.15),transparent_50%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-purple-500/10 blur-[100px] rounded-full" />
      
      {/* Decorative lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
      
      <div className="relative p-8 text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-purple-400" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-purple-400">Coming Soon</span>
        </div>
        <h2 className="font-display text-4xl font-black tracking-[0.15em] mb-3 bg-gradient-to-r from-purple-300 via-white to-purple-300 bg-clip-text text-transparent">
          STUDIOS
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          The professional tier of Loopgate. Film studios, esports orgs, music labels, 
          brands, and production companies will soon be able to build their editor roster, 
          run challenges, host events, and recruit top editors directly from Loopgate.
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 max-w-lg mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-1/50 border border-border/50"
            >
              <feature.icon className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-[10px] text-muted-foreground">{feature.label}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        {!showNotifyForm ? (
          <Button
            onClick={() => setShowNotifyForm(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notify Me When Available
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xs mx-auto space-y-3"
          >
            <input
              type="text"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-surface-0 border border-border rounded-xl text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-0 border border-border rounded-xl text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNotifyForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNotify}
                disabled={submitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {submitting ? "..." : "Submit"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
