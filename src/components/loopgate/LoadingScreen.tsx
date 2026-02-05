import { motion } from 'framer-motion';

interface LoadingScreenProps {
  minimal?: boolean;
}

export default function LoadingScreen({ minimal = false }: LoadingScreenProps) {
  // Minimal inline loader for page transitions
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

  // Full-screen loader - returns null since HTML splash handles initial load
  // This is just a fallback for in-app transitions
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <motion.div
        className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
