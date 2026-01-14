import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

interface PrestigeGateProps {
  onComplete: () => void;
}

export default function PrestigeGate({ onComplete }: PrestigeGateProps) {
  const [vibrating, setVibrating] = useState(false);
  
  useEffect(() => {
    // Trigger vibration if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
    setVibrating(true);
    
    // Auto-dismiss after animation
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          x: vibrating ? [0, -3, 3, -3, 3, 0] : 0,
        }}
        transition={{ 
          scale: { duration: 0.3 },
          x: { duration: 0.4, delay: 0.2 }
        }}
        className="relative"
      >
        {/* Gold glow behind lock */}
        <div className="absolute inset-0 blur-2xl bg-gold/20 rounded-full scale-150" />
        
        {/* Lock container */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative w-32 h-32 rounded-2xl border-2 border-gold/50 bg-background flex items-center justify-center"
          style={{
            boxShadow: '0 0 40px hsl(var(--gold) / 0.3), inset 0 0 20px hsl(var(--gold) / 0.1)',
          }}
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Lock size={48} className="text-gold" />
          </motion.div>
        </motion.div>
        
        {/* Text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6 text-gold font-display text-lg uppercase tracking-widest"
        >
          Invite Only
        </motion.p>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-2 text-muted-foreground text-xs"
        >
          This is a prestige house
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
