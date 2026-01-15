import { motion } from "framer-motion";
import loopgateLogo from "@/assets/loopgate-logo.png";

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
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)'
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

        {/* Right side - iPhone Mockups */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
          
          {/* Back iPhone - Rankings */}
          <motion.div 
            className="relative -mr-24 z-10"
            initial={{ opacity: 0, y: 40, rotate: -5 }}
            animate={{ opacity: 1, y: 0, rotate: -8 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <IPhoneMockup>
              <RankingsScreen />
            </IPhoneMockup>
          </motion.div>

          {/* Front iPhone - Hub */}
          <motion.div 
            className="relative z-20 mr-4"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <IPhoneMockup>
              <HubScreen />
            </IPhoneMockup>
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

// iPhone Frame Component
const IPhoneMockup = ({ children }: { children: React.ReactNode }) => (
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
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-50" />
        
        {/* Screen content */}
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>
        
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full" />
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

// Hub Screen Mock
const HubScreen = () => (
  <div className="w-full h-full bg-[#0a0a0f] pt-12 px-3">
    {/* Status bar */}
    <div className="absolute top-3 left-6 right-6 flex justify-between items-center text-[8px] text-white/60 z-40">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-3 h-2 border border-white/60 rounded-sm">
          <div className="w-2 h-1 bg-white/60 m-[1px]" />
        </div>
      </div>
    </div>

    {/* Header */}
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white">
          K
        </div>
        <div>
          <div className="text-[10px] font-bold text-white">KOLOFX</div>
          <div className="text-[7px] text-amber-400">S+ RANK</div>
        </div>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full">
        <span className="text-[8px] text-amber-400">◆ 2,450</span>
      </div>
    </div>

    {/* GQT Card */}
    <div className="relative mb-3 rounded-xl overflow-hidden">
      <div 
        className="w-full h-20 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <div className="text-center">
          <div className="text-[8px] text-white/50 tracking-wider mb-1">YOUR CLASS</div>
          <div className="text-xl font-black text-amber-400" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            S+ RANK
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>

    {/* Events Section */}
    <div className="text-[8px] text-white/50 tracking-wider mb-2">LIVE EVENTS</div>
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden bg-gradient-to-r from-red-900/30 to-red-800/20 p-2 border border-red-500/20">
        <div className="flex items-center gap-1 mb-1">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[7px] text-red-400 font-medium">LIVE</span>
        </div>
        <div className="text-[9px] font-bold text-white">KILLGATE #4</div>
        <div className="text-[7px] text-white/40">Round 2 • 847 editors</div>
      </div>
      <div className="rounded-lg overflow-hidden bg-white/5 p-2 border border-white/10">
        <div className="text-[9px] font-bold text-white">LOOPVEMBER 2026</div>
        <div className="text-[7px] text-white/40">Starts in 2d 14h</div>
      </div>
    </div>

    {/* Bottom Nav Preview */}
    <div className="absolute bottom-8 left-3 right-3 flex justify-around items-center py-2 bg-black/80 rounded-2xl border border-white/5">
      <div className="w-4 h-4 rounded bg-white/10" />
      <div className="w-4 h-4 rounded bg-white/10" />
      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
      <div className="w-4 h-4 rounded bg-white/10" />
      <div className="w-4 h-4 rounded bg-white/10" />
    </div>
  </div>
);

// Rankings Screen Mock
const RankingsScreen = () => (
  <div className="w-full h-full bg-[#0a0a0f] pt-12 px-3">
    {/* Status bar */}
    <div className="absolute top-3 left-6 right-6 flex justify-between items-center text-[8px] text-white/60 z-40">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-3 h-2 border border-white/60 rounded-sm">
          <div className="w-2 h-1 bg-white/60 m-[1px]" />
        </div>
      </div>
    </div>

    {/* Header */}
    <div className="text-center mt-2 mb-4">
      <div className="text-lg font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
        RANKINGS
      </div>
      <div className="text-[7px] text-white/40 tracking-wider">GLOBAL INDEX</div>
    </div>

    {/* Tabs */}
    <div className="flex gap-1 mb-4">
      <div className="flex-1 py-1.5 bg-white text-black text-[8px] font-bold text-center rounded-lg">INDEX</div>
      <div className="flex-1 py-1.5 bg-white/10 text-white/60 text-[8px] text-center rounded-lg">XP</div>
      <div className="flex-1 py-1.5 bg-white/10 text-white/60 text-[8px] text-center rounded-lg">CREWS</div>
    </div>

    {/* Leaderboard */}
    <div className="space-y-2">
      {[
        { rank: 1, name: 'KOLOFX', score: '2,847', color: 'from-amber-500 to-yellow-500' },
        { rank: 2, name: 'VXSION', score: '2,654', color: 'from-gray-400 to-gray-300' },
        { rank: 3, name: 'NOASSTS', score: '2,521', color: 'from-orange-600 to-orange-500' },
        { rank: 4, name: 'GTXOPTICS', score: '2,398', color: '' },
        { rank: 5, name: 'STELLGOLD', score: '2,287', color: '' },
      ].map((editor) => (
        <div key={editor.rank} className="flex items-center gap-2 py-1.5 px-2 bg-white/5 rounded-lg">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
            editor.color ? `bg-gradient-to-br ${editor.color} text-white` : 'bg-white/10 text-white/60'
          }`}>
            {editor.rank}
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-bold text-white">{editor.name}</div>
          </div>
          <div className="text-[8px] text-amber-400 font-mono">{editor.score}</div>
        </div>
      ))}
    </div>

    {/* Your position */}
    <div className="mt-3 py-2 px-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[7px] font-bold text-white">
          1
        </div>
        <div className="flex-1">
          <div className="text-[8px] text-white/50">YOUR RANK</div>
          <div className="text-[9px] font-bold text-white">#1 GLOBALLY</div>
        </div>
      </div>
    </div>
  </div>
);

export default PosterPage;
