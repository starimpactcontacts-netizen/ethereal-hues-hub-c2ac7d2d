import { motion } from "framer-motion";
import screenHub from "@/assets/poster-screen-hub.png";
import screenDiscover from "@/assets/poster-screen-discover.png";

const PosterPage = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-0 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a35 40%, #252550 70%, #1a1a30 100%)'
      }}
    >
      {/* Instagram Post Container - 1:1 aspect ratio */}
      <div 
        className="relative w-full max-w-[700px] aspect-square overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #0c0c18 0%, #1a1a38 35%, #2a2a55 60%, #181830 100%)'
        }}
      >
        {/* Ambient purple glow */}
        <div 
          className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(100,80,180,0.15) 0%, rgba(80,60,160,0.08) 35%, transparent 60%)'
          }}
        />
        
        {/* Secondary glow near phones */}
        <div 
          className="absolute top-[55%] right-[25%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 50%)'
          }}
        />

        {/* LEFT SIDE EMPTY - Add your own branding */}
        {/* The left 40% is intentionally empty for custom branding */}

        {/* iPhone Mockups - Right side positioned like Epic reference */}
        <div className="absolute inset-0">
          
          {/* Back iPhone - Tilted, positioned behind and to right */}
          <motion.div 
            className="absolute z-10"
            style={{
              right: '-30px',
              top: '50%',
              transform: 'translateY(-45%) rotate(8deg)',
            }}
            initial={{ opacity: 0, y: 100, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          >
            <PremiumIPhone screenshot={screenDiscover} size="small" />
          </motion.div>

          {/* Front iPhone - Straight, larger, in front */}
          <motion.div 
            className="absolute z-20"
            style={{
              right: '120px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
          >
            <PremiumIPhone screenshot={screenHub} size="large" isPrimary />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Premium iPhone 15 Pro Max Mockup with animated shine
const PremiumIPhone = ({ 
  screenshot, 
  size = "large",
  isPrimary = false 
}: { 
  screenshot: string; 
  size?: "large" | "small";
  isPrimary?: boolean;
}) => {
  const dimensions = size === "large" 
    ? { width: 260, height: 530, radius: 52, island: { w: 110, h: 32 }, homeBar: 130 }
    : { width: 220, height: 450, radius: 46, island: { w: 95, h: 28 }, homeBar: 110 };

  return (
    <div 
      className="relative group"
      style={{
        filter: isPrimary ? 'none' : 'brightness(0.9)',
      }}
    >
      {/* Phone shadow */}
      <div 
        className="absolute inset-0 rounded-[52px]"
        style={{
          boxShadow: isPrimary 
            ? '0 60px 120px -30px rgba(0,0,0,0.9), 0 40px 80px -40px rgba(0,0,0,0.8)'
            : '0 50px 100px -30px rgba(0,0,0,0.8), 0 35px 70px -35px rgba(0,0,0,0.7)',
          transform: 'translateY(10px)',
        }}
      />
      
      {/* Phone body - titanium frame */}
      <div 
        className="relative overflow-hidden"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          borderRadius: `${dimensions.radius}px`,
          background: 'linear-gradient(160deg, #4a4a55 0%, #2a2a32 20%, #1a1a22 50%, #0f0f14 100%)',
          padding: '3px',
        }}
      >
        {/* Animated shine effect on frame */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
            borderRadius: `${dimensions.radius}px`,
          }}
          animate={{
            x: ['-200%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeInOut",
          }}
        />
        
        {/* Inner bezel */}
        <div 
          className="relative w-full h-full overflow-hidden"
          style={{
            borderRadius: `${dimensions.radius - 3}px`,
            background: 'linear-gradient(180deg, #222228 0%, #151518 100%)',
            padding: '2px',
          }}
        >
          {/* Screen container */}
          <div 
            className="relative w-full h-full overflow-hidden bg-black"
            style={{
              borderRadius: `${dimensions.radius - 5}px`,
            }}
          >
            {/* Dynamic Island */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 z-50 bg-black"
              style={{
                top: '12px',
                width: `${dimensions.island.w}px`,
                height: `${dimensions.island.h}px`,
                borderRadius: '20px',
              }}
            />
            
            {/* Screenshot */}
            <img 
              src={screenshot} 
              alt="App Screen" 
              className="w-full h-full object-cover object-top"
            />
            
            {/* Screen glass reflection */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(165deg, rgba(255,255,255,0.04) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.05) 100%)',
              }}
            />
            
            {/* Home indicator */}
            <div 
              className="absolute bottom-[8px] left-1/2 -translate-x-1/2 h-[5px] bg-white/50 rounded-full"
              style={{ width: `${dimensions.homeBar}px` }}
            />
          </div>
        </div>
      </div>
      
      {/* Physical buttons */}
      {/* Power button - right */}
      <div 
        className="absolute top-[120px] -right-[1px] w-[4px] h-[70px] rounded-l-sm"
        style={{ 
          background: 'linear-gradient(180deg, #3a3a45 0%, #25252c 50%, #1a1a20 100%)',
          boxShadow: '-1px 0 2px rgba(0,0,0,0.3)',
        }}
      />
      
      {/* Silent switch - left */}
      <div 
        className="absolute top-[90px] -left-[1px] w-[4px] h-[28px] rounded-r-sm"
        style={{ 
          background: 'linear-gradient(180deg, #3a3a45 0%, #25252c 50%, #1a1a20 100%)',
          boxShadow: '1px 0 2px rgba(0,0,0,0.3)',
        }}
      />
      
      {/* Volume up - left */}
      <div 
        className="absolute top-[135px] -left-[1px] w-[4px] h-[55px] rounded-r-sm"
        style={{ 
          background: 'linear-gradient(180deg, #3a3a45 0%, #25252c 50%, #1a1a20 100%)',
          boxShadow: '1px 0 2px rgba(0,0,0,0.3)',
        }}
      />
      
      {/* Volume down - left */}
      <div 
        className="absolute top-[200px] -left-[1px] w-[4px] h-[55px] rounded-r-sm"
        style={{ 
          background: 'linear-gradient(180deg, #3a3a45 0%, #25252c 50%, #1a1a20 100%)',
          boxShadow: '1px 0 2px rgba(0,0,0,0.3)',
        }}
      />
      
      {/* Frame edge highlight */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: `${dimensions.radius}px`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
};

export default PosterPage;
