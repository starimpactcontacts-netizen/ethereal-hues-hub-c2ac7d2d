import { motion } from "framer-motion";
import loopgateLogo from "@/assets/loopgate-logo.png";

const PosterPage = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Instagram Post Container - 1080x1080 aspect ratio */}
      <div 
        className="relative w-full max-w-[540px] aspect-square bg-black overflow-hidden"
        style={{
          boxShadow: '0 0 100px rgba(255,255,255,0.05)'
        }}
      >
        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Radial vignette */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)'
          }}
        />

        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Animated corner accents */}
        <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-white/20" />
        <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-white/20" />
        <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-white/20" />
        <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-white/20" />

        {/* Main content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-8">
          
          {/* Top badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-12 left-1/2 -translate-x-1/2"
          >
            <div className="px-4 py-1.5 border border-white/30 rounded-full">
              <span className="text-[10px] tracking-[0.3em] text-white/60 uppercase font-light">
                Official Release
              </span>
            </div>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-6"
          >
            <img 
              src={loopgateLogo} 
              alt="Loopgate" 
              className="w-20 h-20 object-contain"
            />
          </motion.div>

          {/* Main title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-4"
          >
            <h1 
              className="text-6xl md:text-7xl font-black tracking-tight text-white"
              style={{ 
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: '0.02em'
              }}
            >
              LOOPGATE
            </h1>
          </motion.div>

          {/* Version badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/40" />
            <span 
              className="text-2xl font-bold text-white tracking-widest"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              V1.0 GENESIS
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/40" />
          </motion.div>

          {/* Status indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 mb-10"
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-green-400 text-sm font-medium tracking-wider uppercase">
              Now Live
            </span>
          </motion.div>

          {/* App Store callout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              {/* Apple icon */}
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-white/50 uppercase tracking-wider">Download on the</div>
                <div className="text-lg font-semibold text-white -mt-0.5">App Store</div>
              </div>
            </div>
          </motion.div>

          {/* Bottom tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center"
          >
            <p className="text-xs text-white/40 tracking-[0.2em] uppercase">
              The Global Competitive Editing Index
            </p>
          </motion.div>
        </div>

        {/* Decorative scan line effect */}
        <motion.div
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: 'linear',
            repeatDelay: 2
          }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-30"
        />
      </div>
    </div>
  );
};

export default PosterPage;
