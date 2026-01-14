import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function GQTCard() {
  const { profile } = useAuth();
  const bestScore = profile?.best_gatekeeper_qoi;
  
  return (
    <Link to="/gqt">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.01 }}
        className="relative overflow-hidden bg-gradient-to-br from-background via-surface-0 to-background border-2 border-gold hover:border-gold hover:shadow-lg hover:shadow-gold/20 transition-all group"
      >
        {/* Hazard stripes background */}
        <div className="absolute inset-0 opacity-[0.04]">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, hsl(43 74% 49%) 15px, hsl(43 74% 49%) 30px)',
            }}
          />
        </div>
        
        {/* Animated glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Content */}
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Icon with pulse */}
              <div className="relative">
                <div className="w-16 h-16 bg-gold/10 border-2 border-gold flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <Target className="w-8 h-8 text-gold" />
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 border-2 border-gold/50 animate-ping opacity-20" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-2xl text-gold">GLOBAL QOI TEST</h3>
                  <Zap className="w-5 h-5 text-gold animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "Submit an edit. Get your score."
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {bestScore && (
                <div className="text-right bg-gold/10 px-3 py-2 border border-gold/50">
                  <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Best Score</p>
                  <p className="font-display text-2xl text-gold">{bestScore.toFixed(1)}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="mt-5 pt-4 border-t border-gold/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-[0.15em]">
              Get real feedback on your edits
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gold uppercase tracking-wider font-bold px-3 py-1.5 bg-gold/20 border border-gold group-hover:bg-gold group-hover:text-background transition-colors">
                TEST NOW
              </span>
              <ArrowRight className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
