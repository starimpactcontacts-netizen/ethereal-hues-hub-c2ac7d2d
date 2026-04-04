import { motion } from 'framer-motion';
import loopgateLogo from '@/assets/loopgate-logo.png';
import loopgateBrand from '@/assets/loopgate-brand.png';

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
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 gap-8">
      <img src={loopgateLogo} alt="Loopgate" className="w-80 h-80 max-w-[82vw] max-h-[46vh]" style={{ imageRendering: '-webkit-optimize-contrast' }} />
      <img src={loopgateBrand} alt="LOOPGATE" className="w-56 max-w-[64vw] h-auto" />
    </div>
  );
}
