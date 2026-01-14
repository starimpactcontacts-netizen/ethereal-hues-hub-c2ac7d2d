import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, ArrowRight, Zap } from 'lucide-react';

interface GQTCardProps {
  bestScore?: number | null;
}

export default function GQTCard({ bestScore }: GQTCardProps) {
  return (
    <Link to="/gqt">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative overflow-hidden bg-gradient-to-br from-background via-surface-0 to-background border-2 border-gold/30 hover:border-gold transition-all group"
      >
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 20px)',
            }}
          />
        </div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/5 to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Content */}
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gold/10 border-2 border-gold/50 flex items-center justify-center group-hover:border-gold transition-colors">
                  <Target className="w-7 h-7 text-gold" />
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 border-2 border-gold/30 animate-ping opacity-30" />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-2xl text-gold">Global QOI Test</h3>
                  <Zap className="w-4 h-4 text-gold/60" />
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "submit an edit. get your score."
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {bestScore && (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Best QOI</p>
                  <p className="font-display text-xl text-gold">{bestScore.toFixed(1)}</p>
                </div>
              )}
              <ArrowRight className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
          
          {/* Info banner */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                Get real feedback on your edits
              </span>
              <span className="text-[10px] text-gold uppercase tracking-wider font-semibold px-2 py-1 bg-gold/10 border border-gold/30">
                Test Now
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
