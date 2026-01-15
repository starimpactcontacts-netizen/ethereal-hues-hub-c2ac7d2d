import { motion } from "framer-motion";
import screenHub from "@/assets/poster-screen-hub.png";
import screenDiscover from "@/assets/poster-screen-discover.png";
import loopgateWordmark from "@/assets/loopgate-wordmark-glow.jpg";

const PosterPage = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a14 0%, #14142a 50%, #0a0a14 100%)'
      }}
    >
      {/* Instagram Post Container - 1:1 aspect ratio */}
      <div 
        className="relative w-full max-w-[600px] aspect-square overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #08080f 0%, #12122a 50%, #0a0a18 100%)'
        }}
      >
        {/* Subtle ambient glow behind phones */}
        <div 
          className="absolute top-1/2 right-[30%] -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.06) 40%, transparent 65%)'
          }}
        />

        {/* Left side - Just wordmark logo */}
        <motion.div 
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-[180px]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img 
            src={loopgateWordmark} 
            alt="LOOPGATE" 
            className="w-full h-auto"
          />
          
          {/* App Store text below */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center gap-3"
          >
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div className="text-left">
              <div className="text-[9px] text-white/50 uppercase tracking-wide">Download on the</div>
              <div className="text-base font-semibold text-white -mt-0.5">App Store</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right side - Realistic iPhone Mockups */}
        <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 flex items-end">
          
          {/* Back iPhone - Discover (tilted, behind) */}
          <motion.div 
            className="relative -mr-16 z-10"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ transform: 'rotate(-12deg) translateY(20px)' }}
          >
            <RealisticIPhone screenshot={screenDiscover} />
          </motion.div>

          {/* Front iPhone - Hub (straight, in front) */}
          <motion.div 
            className="relative z-20"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <RealisticIPhone screenshot={screenHub} isPrimary />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Realistic iPhone 15 Pro Mockup
const RealisticIPhone = ({ screenshot, isPrimary = false }: { screenshot: string; isPrimary?: boolean }) => (
  <div 
    className="relative"
    style={{
      filter: isPrimary ? 'none' : 'brightness(0.85)',
    }}
  >
    {/* Phone body with titanium frame */}
    <div 
      className="relative rounded-[44px] p-[2px]"
      style={{
        width: isPrimary ? '220px' : '200px',
        height: isPrimary ? '450px' : '410px',
        background: 'linear-gradient(145deg, #3a3a42 0%, #1f1f24 30%, #0d0d10 100%)',
        boxShadow: isPrimary 
          ? '0 50px 100px -20px rgba(0,0,0,0.8), 0 30px 60px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 40px 80px -20px rgba(0,0,0,0.7), 0 25px 50px -25px rgba(0,0,0,0.6)',
      }}
    >
      {/* Inner frame/bezel */}
      <div 
        className="relative w-full h-full rounded-[42px] p-[2px]"
        style={{
          background: 'linear-gradient(180deg, #2a2a30 0%, #18181c 100%)',
        }}
      >
        {/* Screen */}
        <div className="relative w-full h-full rounded-[40px] bg-black overflow-hidden">
          {/* Dynamic Island */}
          <div 
            className="absolute top-[10px] left-1/2 -translate-x-1/2 z-50 bg-black rounded-full"
            style={{
              width: isPrimary ? '100px' : '90px',
              height: isPrimary ? '28px' : '25px',
            }}
          />
          
          {/* Screenshot content */}
          <img 
            src={screenshot} 
            alt="App Screen" 
            className="w-full h-full object-cover object-top"
          />
          
          {/* Screen glare overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, transparent 100%)',
            }}
          />
          
          {/* Home indicator */}
          <div 
            className="absolute bottom-[6px] left-1/2 -translate-x-1/2 h-[4px] bg-white/40 rounded-full"
            style={{ width: isPrimary ? '120px' : '100px' }}
          />
        </div>
      </div>
    </div>
    
    {/* Side button hints */}
    <div 
      className="absolute right-0 top-[100px] w-[3px] h-[60px] rounded-l-sm"
      style={{ background: 'linear-gradient(180deg, #3a3a42 0%, #1a1a20 100%)' }}
    />
    <div 
      className="absolute left-0 top-[80px] w-[3px] h-[30px] rounded-r-sm"
      style={{ background: 'linear-gradient(180deg, #3a3a42 0%, #1a1a20 100%)' }}
    />
    <div 
      className="absolute left-0 top-[120px] w-[3px] h-[50px] rounded-r-sm"
      style={{ background: 'linear-gradient(180deg, #3a3a42 0%, #1a1a20 100%)' }}
    />
    <div 
      className="absolute left-0 top-[180px] w-[3px] h-[50px] rounded-r-sm"
      style={{ background: 'linear-gradient(180deg, #3a3a42 0%, #1a1a20 100%)' }}
    />
  </div>
);

export default PosterPage;
