import { motion } from 'framer-motion';
import loopgateLogo from '@/assets/loopgate-logo.jpeg';

interface LoadingScreenProps {
  minimal?: boolean;
}

export default function LoadingScreen({ minimal = false }: LoadingScreenProps) {
  if (minimal) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 gap-5">
      <img src={loopgateLogo} alt="Loopgate" className="w-20 h-20" style={{ imageRendering: '-webkit-optimize-contrast' }} />
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', letterSpacing: '0.18em', color: '#fff' }}>
        LOOPGATE
      </span>
    </div>
  );
}
