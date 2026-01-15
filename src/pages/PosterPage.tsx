import { motion } from "framer-motion";
import loopgateLogo from "@/assets/loopgate-logo.png";
import screenHub from "@/assets/poster-screen-hub.png";
import screenDiscover from "@/assets/poster-screen-discover.png";

const PosterPage = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 30%, #16213e 60%, #0f0f1a 100%)'
      }}
    >
      {/* Instagram Post Container - 1:1 aspect ratio */}
      <div 
        className="relative w-full max-w-[600px] aspect-square overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d0d18 0%, #1a1a30 40%, #12122a 100%)'
        }}
      >
        {/* Subtle radial glow behind phones */}
        <div 
          className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(234,179,8,0.1) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)'
          }}
        />

        {/* Left side - Branding */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20">
          {/* Logo */}
          <motion.img 
            src={loopgateLogo} 
            alt="Loopgate" 
            className="w-16 h-16 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          />
          
          {/* Title */}
          <motion.h1 
            className="text-4xl font-black text-white tracking-tight mb-2"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            LOOPGATE
          </motion.h1>
          
          {/* Version */}
          <motion.div 
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-white/70 tracking-wider">V1.0 LIVE</span>
          </motion.div>

          {/* App Store badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10"
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-left">
              <div className="text-[8px] text-white/50 uppercase">Download on the</div>
              <div className="text-sm font-semibold text-white -mt-0.5">App Store</div>
            </div>
          </motion.div>
        </div>

        {/* Right side - iPhone Mockups with REAL screenshots */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
          
          {/* Back iPhone - Discover */}
          <motion.div 
            className="relative -mr-20 z-10"
            initial={{ opacity: 0, y: 40, rotate: -5 }}
            animate={{ opacity: 1, y: 0, rotate: -8 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <IPhoneMockup screenshot={screenDiscover} />
          </motion.div>

          {/* Front iPhone - Hub */}
          <motion.div 
            className="relative z-20 mr-4"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <IPhoneMockup screenshot={screenHub} />
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-6 left-8 right-8"
        >
          <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase">
            The Global Competitive Editing Index
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// iPhone Frame Component with real screenshot
const IPhoneMockup = ({ screenshot }: { screenshot: string }) => (
  <div className="relative">
    {/* iPhone outer frame */}
    <div 
      className="relative w-[180px] h-[380px] rounded-[32px] p-[3px]"
      style={{
        background: 'linear-gradient(145deg, #2a2a35 0%, #1a1a20 50%, #0a0a0f 100%)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
      }}
    >
      {/* iPhone inner bezel */}
      <div className="relative w-full h-full rounded-[29px] bg-black overflow-hidden">
        {/* Screen content - REAL screenshot */}
        <img 
          src={screenshot} 
          alt="App Screen" 
          className="w-full h-full object-cover object-top"
        />
        
        {/* Home indicator overlay */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
    
    {/* Reflection/glow effect */}
    <div 
      className="absolute -inset-4 rounded-[40px] pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)'
      }}
    />
  </div>
);

export default PosterPage;
