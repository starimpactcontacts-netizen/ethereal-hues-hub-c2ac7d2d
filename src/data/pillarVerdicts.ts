// Pillar-specific verdicts — PSL/face-scan style descriptive analysis per pillar
// Each pillar gets a detailed readout based on score percentage

export interface PillarVerdict {
  label: string;
  tag: string;        // Short tag like "ELITE" or "WEAK"
  tagColor: string;   // Tailwind color class
  description: string;
}

type PillarId = 'emotion' | 'creativity' | 'sync' | 'identity' | 'execution' |
  'rhythm_score' | 'creativity_score' | 'technical_score' | 'emotional_score' | 'style_score';

function getPercentage(score: number, max: number): number {
  return (score / max) * 100;
}

// Verdict bank per pillar
const verdictBank: Record<string, { high: string[]; mid: string[]; low: string[]; vlow: string[] }> = {
  emotion: {
    high: [
      "Emotional depth is off the charts. Your edit made us feel something real.",
      "You weaponize emotion. This is rare talent — most editors never reach this.",
      "Peak emotional intelligence in editing. The viewer is fully immersed.",
    ],
    mid: [
      "Decent emotional resonance but it doesn't hit as hard as it could.",
      "You understand emotion exists but you're not maximizing it yet.",
      "The feeling is there, just buried under too much noise.",
    ],
    low: [
      "Flat. The edit moves but nothing moves the viewer.",
      "Emotion score indicates surface-level engagement. Dig deeper.",
      "You're editing clips, not telling stories. Feel the music.",
    ],
    vlow: [
      "Zero emotional impact detected. This is a slideshow with effects.",
      "The viewer feels nothing. That's the worst thing an edit can do.",
      "Clinical execution, zero soul. This needs a complete rethink.",
    ],
  },
  creativity: {
    high: [
      "Highly original concept execution. You're not following trends, you're creating them.",
      "Creative vision is elite-tier. Your ideas are genuinely fresh.",
      "Top percentile creativity. This edit thinks different.",
    ],
    mid: [
      "Creative enough to stand out from the crowd but not to lead it.",
      "Good ideas, average execution of those ideas. Push harder.",
      "You see the box but you're not fully outside it yet.",
    ],
    low: [
      "Derivative. This looks like 50 other edits from this month.",
      "Creativity score is below average. Where's YOUR voice?",
      "Preset-dependent creative choices. Think before you drag and drop.",
    ],
    vlow: [
      "Template-level creativity. Nothing here is yours.",
      "Zero original thought detected in the creative direction.",
      "You copied, you didn't create. There's a difference.",
    ],
  },
  sync: {
    high: [
      "Surgical precision. Every cut lands exactly where it should.",
      "Your sync is mathematically perfect. Frame-perfect timing throughout.",
      "Elite-level sync mastery. The edit and the music are one entity.",
    ],
    mid: [
      "Sync is passable but inconsistent. Some hits land, some miss.",
      "Average timing awareness. You hear the beats but you're late on half.",
      "The foundation of sync is there, needs refinement in the details.",
    ],
    low: [
      "Sync issues throughout. The edit fights the music instead of riding it.",
      "Below average beat matching. Study your waveforms.",
      "Off-beat cuts are dragging the entire edit down.",
    ],
    vlow: [
      "Completely out of sync. Did you even listen to the song?",
      "The timing is so off it feels intentionally wrong.",
      "Zero rhythmic awareness. This is the #1 thing to fix.",
    ],
  },
  identity: {
    high: [
      "Unmistakable style DNA. This is YOUR edit and everyone would know it.",
      "Strong personal brand in the craft. You've found your signature.",
      "Identity score is exceptional — you are a recognizable editor.",
    ],
    mid: [
      "Hints of a personal style emerging but not fully formed yet.",
      "You're developing an identity but it's still inconsistent.",
      "Average stylistic presence. Keep experimenting until it clicks.",
    ],
    low: [
      "No discernible personal style. This could be anyone's edit.",
      "Identity crisis — the edit borrows from too many sources.",
      "Your style is invisible. Find what makes YOU different.",
    ],
    vlow: [
      "Complete absence of personal identity. Generic to the core.",
      "Nothing about this edit says who made it. That's a problem.",
      "Style score critical. You need to stop copying and start creating.",
    ],
  },
  execution: {
    high: [
      "Flawless technical execution. Clean exports, smooth motion, zero jank.",
      "Production quality is professional-grade. No visible flaws.",
      "Top-tier craft. The technical foundation is rock solid.",
    ],
    mid: [
      "Decent execution with some rough edges. Polish the details.",
      "Technically competent but not yet refined. Close to leveling up.",
      "The skills are there, the consistency isn't.",
    ],
    low: [
      "Technical issues are holding the edit back significantly.",
      "Execution below standard — choppy transitions, poor rendering.",
      "The idea might be good but the hands can't deliver it yet.",
    ],
    vlow: [
      "Severe technical deficiencies. Master the basics first.",
      "Execution is amateur-level. Learn your tools before competing.",
      "Raw, unpolished, and rough. Needs fundamental skill work.",
    ],
  },
};

// Map scoring pillar keys to verdict bank keys
const pillarKeyMap: Record<string, string> = {
  emotion: 'emotion',
  creativity: 'creativity',
  sync: 'sync',
  identity: 'identity',
  execution: 'execution',
  // GQT pillar keys
  rhythm_score: 'sync',
  creativity_score: 'creativity',
  technical_score: 'execution',
  emotional_score: 'emotion',
  style_score: 'identity',
};

export function getPillarVerdict(pillarKey: string, score: number, max: number): PillarVerdict {
  const pct = getPercentage(score, max);
  const bankKey = pillarKeyMap[pillarKey] || pillarKey;
  const bank = verdictBank[bankKey] || verdictBank.execution;

  let tag: string;
  let tagColor: string;
  let pool: string[];

  if (pct >= 80) {
    tag = 'ELITE';
    tagColor = 'text-gold';
    pool = bank.high;
  } else if (pct >= 55) {
    tag = 'AVERAGE';
    tagColor = 'text-blue-400';
    pool = bank.mid;
  } else if (pct >= 30) {
    tag = 'WEAK';
    tagColor = 'text-orange-400';
    pool = bank.low;
  } else {
    tag = 'CRITICAL';
    tagColor = 'text-red-500';
    pool = bank.vlow;
  }

  // Deterministic pick based on score to avoid random flicker
  const description = pool[Math.floor(score) % pool.length];

  const labelMap: Record<string, string> = {
    emotion: 'EMOTIONAL IMPACT',
    creativity: 'CREATIVE VISION',
    sync: 'SYNC & TIMING',
    identity: 'STYLE IDENTITY',
    execution: 'TECHNICAL EXECUTION',
  };

  return {
    label: labelMap[bankKey] || bankKey.toUpperCase(),
    tag,
    tagColor,
    description,
  };
}
