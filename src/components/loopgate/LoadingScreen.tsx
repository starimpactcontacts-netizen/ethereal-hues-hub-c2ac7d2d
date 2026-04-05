import { motion } from 'framer-motion';
import GateIcon from '@/components/loopgate/GateIcon';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative flex items-center justify-center"
      >
        <div className="absolute inset-[-18px] rounded-full bg-foreground/5 blur-2xl" aria-hidden="true" />
        <GateIcon size={48} className="relative text-foreground" aria-hidden="true" />
      </motion.div>
    </div>
  );
}
