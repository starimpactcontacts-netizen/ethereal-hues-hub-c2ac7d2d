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
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <motion.img
        src={loopgateLogo}
        alt="Loopgate"
        className="w-[120px] h-[120px] max-w-[30vw] max-h-[15vh] object-contain"
        style={{ imageRendering: '-webkit-optimize-contrast', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.06))' }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}
