// GQT (Global QOI Test) Configuration

// ====================
// INTERROGATION OPTIONS
// ====================

export const editorTypes = [
  { value: 'motion', label: 'Motion' },
  { value: 'velocity', label: 'Velocity' },
  { value: 'amv', label: 'AMV' },
  { value: 'capcut', label: 'CapCut' },
  { value: 'manga', label: 'Manga' },
  { value: 'liveaction', label: 'Live-Action' },
  { value: 'fx', label: 'FX / After Effects' },
  { value: 'character', label: 'Character Edits' },
  { value: 'gaming', label: 'Gaming Edits' },
] as const;

export const yearsEditingOptions = [
  { value: '0-6m', label: '0-6 months' },
  { value: '6-12m', label: '6-12 months' },
  { value: '1-2y', label: '1-2 years' },
  { value: '2-4y', label: '2-4 years' },
  { value: '5+', label: '5+ years' },
] as const;

export const softwareOptions = [
  { value: 'aftereffects', label: 'After Effects' },
  { value: 'premiere', label: 'Premiere Pro' },
  { value: 'davinci', label: 'DaVinci Resolve' },
  { value: 'capcut', label: 'CapCut' },
  { value: 'vegas', label: 'Sony Vegas' },
  { value: 'alight', label: 'Alight Motion' },
  { value: 'finalcut', label: 'Final Cut Pro' },
] as const;

export const editingSpeedOptions = [
  { value: 'slow', label: 'I take my time' },
  { value: 'average', label: "I'm average" },
  { value: 'fast', label: "I'm fast" },
  { value: 'built_different', label: "I'm built different" },
] as const;

export const testPurposeOptions = [
  { value: 'brutal', label: 'Get brutally judged' },
  { value: 'improve', label: 'Improve fast' },
  { value: 'standing', label: 'See where I stand' },
  { value: 'challenge', label: 'Challenge myself' },
  { value: 'curious', label: 'Just curious' },
] as const;

export const editingGoalOptions = [
  { value: 'community', label: 'Build a community' },
  { value: 'freelance', label: 'Go freelance' },
  { value: 'improve', label: 'Just improve' },
  { value: 'fun', label: 'For fun' },
] as const;

export const confidenceLabels: Record<number, string> = {
  1: "It's trash lol",
  2: "Pretty bad",
  3: "Mid",
  4: "Below average",
  5: "Not bad",
  6: "Decent",
  7: "Heat",
  8: "Actually good",
  9: "This clears",
  10: "I am HIM",
};

// ====================
// RANK SYSTEM (0-100)
// ====================

export type GQTRank = 'F' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+' | 'S++';

export interface RankConfig {
  rank: GQTRank;
  minScore: number;
  maxScore: number;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  description: string;
}

export const rankConfigs: RankConfig[] = [
  { rank: 'S++', minScore: 96, maxScore: 100, label: 'S++', color: 'text-gold', bgClass: 'bg-gradient-to-br from-gold/30 via-gold/20 to-gold/10', borderClass: 'border-gold', description: 'Legendary. Top 0.1%' },
  { rank: 'S+', minScore: 90, maxScore: 95, label: 'S+', color: 'text-gold', bgClass: 'bg-gradient-to-br from-gold/20 to-gold/5', borderClass: 'border-gold/80', description: 'Elite mastery' },
  { rank: 'S', minScore: 80, maxScore: 89, label: 'S', color: 'text-amber-400', bgClass: 'bg-gradient-to-br from-amber-400/20 to-amber-400/5', borderClass: 'border-amber-400', description: 'Pro-tier work' },
  { rank: 'A', minScore: 70, maxScore: 79, label: 'A', color: 'text-emerald-400', bgClass: 'bg-gradient-to-br from-emerald-400/20 to-emerald-400/5', borderClass: 'border-emerald-400', description: 'Advanced skill' },
  { rank: 'B', minScore: 60, maxScore: 69, label: 'B', color: 'text-blue-400', bgClass: 'bg-gradient-to-br from-blue-400/20 to-blue-400/5', borderClass: 'border-blue-400', description: 'Above average' },
  { rank: 'C', minScore: 50, maxScore: 59, label: 'C', color: 'text-slate-300', bgClass: 'bg-gradient-to-br from-slate-300/20 to-slate-300/5', borderClass: 'border-slate-300', description: 'Average editor' },
  { rank: 'D', minScore: 40, maxScore: 49, label: 'D', color: 'text-orange-400', bgClass: 'bg-gradient-to-br from-orange-400/20 to-orange-400/5', borderClass: 'border-orange-400', description: 'Needs work' },
  { rank: 'F', minScore: 0, maxScore: 39, label: 'F', color: 'text-red-500', bgClass: 'bg-gradient-to-br from-red-500/20 to-red-500/5', borderClass: 'border-red-500', description: 'Back to basics' },
];

export function getRankFromScore(score: number): RankConfig {
  return rankConfigs.find(r => score >= r.minScore && score <= r.maxScore) || rankConfigs[rankConfigs.length - 1];
}

export function getPercentile(score: number): number {
  if (score >= 96) return 0.1;
  if (score >= 90) return 1;
  if (score >= 80) return 5;
  if (score >= 70) return 15;
  if (score >= 60) return 30;
  if (score >= 50) return 50;
  if (score >= 40) return 70;
  return 90;
}

// ====================
// PROJECTED LEAGUES (GQT-Based)
// ====================

export interface ProjectedLeague {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  bgClass: string;
  indexFloor: number;
}

// New GQT-based league system: Rookie → Contributor → Skilled → Advanced → Master → Legend
export const gqtLeagues: ProjectedLeague[] = [
  { id: 'legend', name: 'LEGEND', subtitle: 'S+ / S++ Tier', color: 'text-gold', bgClass: 'bg-gold/10', indexFloor: 200 },
  { id: 'master', name: 'MASTER', subtitle: 'S Tier', color: 'text-amber-400', bgClass: 'bg-amber-400/10', indexFloor: 120 },
  { id: 'advanced', name: 'ADVANCED', subtitle: 'A Tier', color: 'text-emerald-400', bgClass: 'bg-emerald-400/10', indexFloor: 75 },
  { id: 'skilled', name: 'SKILLED', subtitle: 'B Tier', color: 'text-blue-400', bgClass: 'bg-blue-400/10', indexFloor: 40 },
  { id: 'contributor', name: 'CONTRIBUTOR', subtitle: 'C Tier', color: 'text-slate-300', bgClass: 'bg-slate-300/10', indexFloor: 20 },
  { id: 'rookie', name: 'ROOKIE', subtitle: 'F / D Tier', color: 'text-muted-foreground', bgClass: 'bg-muted/20', indexFloor: 0 },
];

// Index floor values by GQT rank (determines starting Index power)
export const indexFloorByRank: Record<GQTRank, number> = {
  'F': 0,
  'D': 10,
  'C': 20,
  'B': 40,
  'A': 75,
  'S': 120,
  'S+': 200,
  'S++': 300,
};

export function getProjectedLeagueFromScore(score: number): ProjectedLeague {
  if (score >= 90) return gqtLeagues[0]; // LEGEND (S+, S++)
  if (score >= 80) return gqtLeagues[1]; // MASTER (S)
  if (score >= 70) return gqtLeagues[2]; // ADVANCED (A)
  if (score >= 60) return gqtLeagues[3]; // SKILLED (B)
  if (score >= 50) return gqtLeagues[4]; // CONTRIBUTOR (C)
  return gqtLeagues[5]; // ROOKIE (F, D)
}

export function getProjectedLeagueFromRank(rank: GQTRank): ProjectedLeague {
  switch (rank) {
    case 'S++':
    case 'S+':
      return gqtLeagues[0]; // LEGEND
    case 'S':
      return gqtLeagues[1]; // MASTER
    case 'A':
      return gqtLeagues[2]; // ADVANCED
    case 'B':
      return gqtLeagues[3]; // SKILLED
    case 'C':
      return gqtLeagues[4]; // CONTRIBUTOR
    case 'D':
    case 'F':
    default:
      return gqtLeagues[5]; // ROOKIE
  }
}

export function getIndexFloorFromRank(rank: GQTRank): number {
  return indexFloorByRank[rank] || 0;
}

// ====================
// SCORING PILLARS
// ====================

export const scoringPillars = [
  { key: 'rhythm_score', label: 'Rhythm & Timing', maxPoints: 25, icon: 'music' },
  { key: 'creativity_score', label: 'Creativity & Concept', maxPoints: 25, icon: 'lightbulb' },
  { key: 'technical_score', label: 'Technical Execution', maxPoints: 25, icon: 'settings' },
  { key: 'emotional_score', label: 'Emotional Impact', maxPoints: 15, icon: 'heart' },
  { key: 'style_score', label: 'Style Identity', maxPoints: 10, icon: 'fingerprint' },
] as const;

// ====================
// JUDGE QUOTES (100-point scale)
// ====================

export interface JudgeQuote {
  minScore: number;
  maxScore: number;
  lines: string[];
}

export const brutalQuotes: JudgeQuote[] = [
  // F tier (0-39)
  { minScore: 0, maxScore: 39, lines: [
    "This edit was a cry for help.",
    "Preset merchant behavior.",
    "Your pacing is fighting demons.",
    "Did you render this in a microwave?",
    "I've seen better edits from Windows Movie Maker.",
    "Your transitions need therapy.",
    "This edit peaked at the intro.",
    "CapCut template energy.",
    "The clip selection is criminal.",
    "You have passion. Now learn discipline.",
    "Back to basics. Master the fundamentals first.",
    "Your idea is better than your execution.",
  ]},
  // D tier (40-49)
  { minScore: 40, maxScore: 49, lines: [
    "You're fighting. That's something.",
    "Raw potential wasted by lack of focus.",
    "Everything everywhere but nowhere.",
    "Your presets are editing more than you are.",
    "There's a voice in here. Buried deep.",
    "Study sync. It's the heart of editing.",
    "Less effects, more intention.",
    "Slow down. Focus on pacing before effects.",
  ]},
  // C tier (50-59)
  { minScore: 50, maxScore: 59, lines: [
    "Clean execution but zero soul.",
    "Technically competent, artistically bankrupt.",
    "You followed the tutorial. Congrats.",
    "Solid work. Not memorable, but solid.",
    "You're in the pack. Not ahead of it.",
    "Safe choices. Safe edit. Forgettable.",
    "You're not bad. You're just not different.",
    "The sync is there. The vision isn't.",
    "A competent edit that nobody will remember.",
    "Good instincts. Sharpen them.",
  ]},
  // B tier (60-69)
  { minScore: 60, maxScore: 69, lines: [
    "You're close. Fix your pacing and you level up.",
    "The structure is there. Now add soul.",
    "You understand the rules. Now break them intentionally.",
    "Consistency is your next challenge.",
    "Polish your transitions. That's the gap.",
    "You're almost there. One more push.",
    "The vision is clear. The execution needs work.",
    "Strong showing. Now outdo yourself.",
  ]},
  // A tier (70-79)
  { minScore: 70, maxScore: 79, lines: [
    "This is what confidence looks like.",
    "You actually understand pacing. Rare.",
    "You've earned this score. Now maintain it.",
    "Pro-tier work. Don't get complacent.",
    "Excellent. Now find your signature style.",
    "Clear artistic intention. Execution on point.",
    "You're developing a voice. Protect it.",
    "You're entering the pro conversation now.",
  ]},
  // S tier (80-89)
  { minScore: 80, maxScore: 89, lines: [
    "Finally. Someone who gets it.",
    "No notes. Keep creating.",
    "You're in the top percentile. Act like it.",
    "Elite energy. Don't lose it.",
    "You could go pro. Actually.",
    "Nothing to fix. Just keep evolving.",
    "You've mastered the craft. Now transcend it.",
    "This is professional-grade work. Period.",
    "Maturity in the craft. Rare to see.",
  ]},
  // S+ tier (90-95)
  { minScore: 90, maxScore: 95, lines: [
    "This is Prestige-tier work.",
    "I don't have criticism. Just respect.",
    "One of the best I've seen this month.",
    "I have nothing to teach you. Just admiration.",
    "Elite. You're ready for the top.",
    "You've earned your place among the elite.",
    "This is what years of dedication looks like.",
    "Exceptional. True mastery on display.",
  ]},
  // S++ tier (96-100)
  { minScore: 96, maxScore: 100, lines: [
    "This transcends competition. This is art.",
    "Among the finest work I've reviewed this year.",
    "Legacy-tier. You will be remembered.",
    "LEGENDARY. ABSOLUTELY LEGENDARY.",
    "They're gonna study this edit for years.",
    "GOAT behavior. Certified GOAT behavior.",
    "This isn't an edit. It's a STATEMENT.",
    "Perfection. Nothing else to say.",
  ]},
];

export function getRandomQuote(score: number): string {
  const quoteSet = brutalQuotes.find(q => score >= q.minScore && score <= q.maxScore);
  if (!quoteSet || quoteSet.lines.length === 0) {
    return "Score processed.";
  }
  return quoteSet.lines[Math.floor(Math.random() * quoteSet.lines.length)];
}
