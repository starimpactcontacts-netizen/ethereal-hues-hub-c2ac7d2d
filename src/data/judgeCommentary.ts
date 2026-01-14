// Judge Archetype Commentary Lines for Gatekeeper Test
// Each archetype has unique voice and scoring context

export type JudgeArchetype = 'realist' | 'hype_demon' | 'coach' | 'troll' | 'old_pro';

export interface JudgeComment {
  archetype: JudgeArchetype;
  minQOI: number; // Minimum QOI score to use this line
  maxQOI: number; // Maximum QOI score to use this line
  line: string;
}

// REALIST - Brutal honesty, no sugarcoating
export const realistComments: JudgeComment[] = [
  // Low scores (0-100)
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "This edit was a cry for help." },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "Preset merchant behavior." },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "Your pacing is fighting demons." },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "Did you render this in a microwave?" },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "The motion blur is blurring your career prospects." },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "I've seen better edits from Windows Movie Maker." },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "Your transitions need therapy." },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "This edit peaked at the intro." },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "CapCut template energy." },
  { archetype: 'realist', minQOI: 0, maxQOI: 80, line: "The clip selection is criminal." },
  
  // Mid scores (100-180)
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "Clean execution but zero soul." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "Technically competent, artistically bankrupt." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "You followed the tutorial. Congrats." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "Solid work. Not memorable, but solid." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "You're in the pack. Not ahead of it." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "This is what 'mid' looks like in 4K." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "Safe choices. Safe edit. Forgettable." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "You're not bad. You're just not different." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "The sync is there. The vision isn't." },
  { archetype: 'realist', minQOI: 80, maxQOI: 160, line: "A competent edit that nobody will remember." },
  
  // High scores (180-300)
  { archetype: 'realist', minQOI: 160, maxQOI: 300, line: "Finally. Someone who gets it." },
  { archetype: 'realist', minQOI: 160, maxQOI: 300, line: "This is what confidence looks like." },
  { archetype: 'realist', minQOI: 160, maxQOI: 300, line: "You actually understand pacing. Rare." },
  { archetype: 'realist', minQOI: 160, maxQOI: 300, line: "No notes. Keep creating." },
  { archetype: 'realist', minQOI: 160, maxQOI: 300, line: "You're in the top percentile. Act like it." },
  { archetype: 'realist', minQOI: 200, maxQOI: 300, line: "Elite energy. Don't lose it." },
  { archetype: 'realist', minQOI: 200, maxQOI: 300, line: "You could go pro. Actually." },
  { archetype: 'realist', minQOI: 220, maxQOI: 300, line: "This is Prestige-tier work." },
  { archetype: 'realist', minQOI: 240, maxQOI: 300, line: "I don't have criticism. Just respect." },
  { archetype: 'realist', minQOI: 260, maxQOI: 300, line: "One of the best I've seen this month." },
];

// HYPE DEMON - Maximum energy when scores are high
export const hypeDemonComments: JudgeComment[] = [
  // Can't be hype about bad scores
  { archetype: 'hype_demon', minQOI: 0, maxQOI: 100, line: "I wanted to hype you but... nah." },
  { archetype: 'hype_demon', minQOI: 0, maxQOI: 100, line: "Even I can't spin this one." },
  { archetype: 'hype_demon', minQOI: 0, maxQOI: 100, line: "Resubmit when you're ready to cook." },
  
  // Mid scores - cautious hype
  { archetype: 'hype_demon', minQOI: 100, maxQOI: 160, line: "Getting warmer. Keep going." },
  { archetype: 'hype_demon', minQOI: 100, maxQOI: 160, line: "I see the potential. Now execute." },
  { archetype: 'hype_demon', minQOI: 100, maxQOI: 160, line: "You're cooking. Low heat, but cooking." },
  { archetype: 'hype_demon', minQOI: 100, maxQOI: 160, line: "This could hit. With work." },
  { archetype: 'hype_demon', minQOI: 100, maxQOI: 160, line: "Not bad at all. Level up and come back." },
  
  // High scores - FULL HYPE
  { archetype: 'hype_demon', minQOI: 160, maxQOI: 200, line: "YOU COOKED." },
  { archetype: 'hype_demon', minQOI: 160, maxQOI: 200, line: "This is the one. This is IT." },
  { archetype: 'hype_demon', minQOI: 160, maxQOI: 200, line: "OKAY I SEE YOU." },
  { archetype: 'hype_demon', minQOI: 160, maxQOI: 200, line: "Your sync is ILLEGAL in 14 countries." },
  { archetype: 'hype_demon', minQOI: 160, maxQOI: 200, line: "BRO. BRO. This is actually fire." },
  { archetype: 'hype_demon', minQOI: 180, maxQOI: 240, line: "You didn't come to play. You came to WIN." },
  { archetype: 'hype_demon', minQOI: 180, maxQOI: 240, line: "THE SYNC. THE PACING. THE VISION." },
  { archetype: 'hype_demon', minQOI: 180, maxQOI: 240, line: "This edit is a cultural reset." },
  { archetype: 'hype_demon', minQOI: 180, maxQOI: 240, line: "You're not just editing. You're architecting." },
  { archetype: 'hype_demon', minQOI: 200, maxQOI: 280, line: "This is Prestige-tier energy." },
  { archetype: 'hype_demon', minQOI: 200, maxQOI: 280, line: "NOBODY is safe when you drop." },
  { archetype: 'hype_demon', minQOI: 200, maxQOI: 280, line: "You just violated the timeline with this." },
  { archetype: 'hype_demon', minQOI: 220, maxQOI: 300, line: "LEGENDARY. ABSOLUTELY LEGENDARY." },
  { archetype: 'hype_demon', minQOI: 220, maxQOI: 300, line: "They're gonna study this edit for years." },
  { archetype: 'hype_demon', minQOI: 240, maxQOI: 300, line: "GOAT behavior. Certified GOAT behavior." },
  { archetype: 'hype_demon', minQOI: 260, maxQOI: 300, line: "This isn't an edit. It's a STATEMENT." },
  { archetype: 'hype_demon', minQOI: 280, maxQOI: 300, line: "I'm speechless. This is perfection." },
];

// COACH - Tough love, actionable feedback
export const coachComments: JudgeComment[] = [
  // Low scores
  { archetype: 'coach', minQOI: 0, maxQOI: 80, line: "Back to basics. Master the fundamentals first." },
  { archetype: 'coach', minQOI: 0, maxQOI: 80, line: "Your idea is better than your execution." },
  { archetype: 'coach', minQOI: 0, maxQOI: 80, line: "Watch more edits before you make more." },
  { archetype: 'coach', minQOI: 0, maxQOI: 80, line: "Slow down. Focus on pacing before effects." },
  { archetype: 'coach', minQOI: 0, maxQOI: 80, line: "The foundation is weak. Rebuild it." },
  { archetype: 'coach', minQOI: 0, maxQOI: 80, line: "You're rushing. That's your first mistake." },
  { archetype: 'coach', minQOI: 0, maxQOI: 80, line: "Study sync. It's the heart of editing." },
  { archetype: 'coach', minQOI: 0, maxQOI: 80, line: "Less effects, more intention." },
  
  // Mid scores
  { archetype: 'coach', minQOI: 80, maxQOI: 160, line: "You're close. Fix your pacing and you level up." },
  { archetype: 'coach', minQOI: 80, maxQOI: 160, line: "Good instincts. Sharpen them." },
  { archetype: 'coach', minQOI: 80, maxQOI: 160, line: "The structure is there. Now add soul." },
  { archetype: 'coach', minQOI: 80, maxQOI: 160, line: "You understand the rules. Now break them intentionally." },
  { archetype: 'coach', minQOI: 80, maxQOI: 160, line: "Consistency is your next challenge." },
  { archetype: 'coach', minQOI: 80, maxQOI: 160, line: "Polish your transitions. That's the gap." },
  { archetype: 'coach', minQOI: 80, maxQOI: 160, line: "You're almost there. One more push." },
  { archetype: 'coach', minQOI: 100, maxQOI: 180, line: "The vision is clear. The execution needs work." },
  { archetype: 'coach', minQOI: 100, maxQOI: 180, line: "Strong showing. Now outdo yourself." },
  { archetype: 'coach', minQOI: 100, maxQOI: 180, line: "This is growth. Keep that momentum." },
  
  // High scores
  { archetype: 'coach', minQOI: 160, maxQOI: 220, line: "You've earned this score. Now maintain it." },
  { archetype: 'coach', minQOI: 160, maxQOI: 220, line: "Pro-tier work. Don't get complacent." },
  { archetype: 'coach', minQOI: 160, maxQOI: 220, line: "Excellent. Now find your signature style." },
  { archetype: 'coach', minQOI: 180, maxQOI: 260, line: "Nothing to fix. Just keep evolving." },
  { archetype: 'coach', minQOI: 180, maxQOI: 260, line: "You've mastered the craft. Now transcend it." },
  { archetype: 'coach', minQOI: 200, maxQOI: 300, line: "I have nothing to teach you. Just admiration." },
  { archetype: 'coach', minQOI: 220, maxQOI: 300, line: "Elite. You're ready for the top." },
  { archetype: 'coach', minQOI: 240, maxQOI: 300, line: "This is what dedication looks like." },
];

// TROLL - Chaotic, meme-ready, funny
export const trollComments: JudgeComment[] = [
  // Low scores
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "My eyes lagged watching this." },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "CapCut tried to escape midway through." },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "Bro why did you pick THAT clip 💀" },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "The render button is not a magic wand." },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "Did your timeline have a seizure?" },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "This edit hurt me personally." },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "Even the watermark looks disappointed." },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "Brother. What was the vision here?" },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "The music deserved better." },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "This edit is in witness protection now." },
  { archetype: 'troll', minQOI: 0, maxQOI: 80, line: "You woke up and chose violence against my eyes." },
  
  // Mid scores
  { archetype: 'troll', minQOI: 80, maxQOI: 160, line: "It's giving... effort. I respect it." },
  { archetype: 'troll', minQOI: 80, maxQOI: 160, line: "Congratulations, you've achieved mid." },
  { archetype: 'troll', minQOI: 80, maxQOI: 160, line: "Not terrible. That's the best I can do." },
  { archetype: 'troll', minQOI: 80, maxQOI: 160, line: "My expectations were low and you met them." },
  { archetype: 'troll', minQOI: 80, maxQOI: 160, line: "The algorithm might pick this up. Maybe." },
  { archetype: 'troll', minQOI: 100, maxQOI: 180, line: "Okay okay okay, this is actually decent." },
  { archetype: 'troll', minQOI: 100, maxQOI: 180, line: "I was ready to roast but you survived." },
  
  // High scores - even the troll has to admit it
  { archetype: 'troll', minQOI: 160, maxQOI: 220, line: "Wait. This is actually fire. I hate it." },
  { archetype: 'troll', minQOI: 160, maxQOI: 220, line: "I can't even troll this. You cooked." },
  { archetype: 'troll', minQOI: 180, maxQOI: 260, line: "Alright alright alright, you're valid." },
  { archetype: 'troll', minQOI: 180, maxQOI: 260, line: "My lawyer advised me not to hate on this." },
  { archetype: 'troll', minQOI: 200, maxQOI: 300, line: "Even I gotta bow. This is elite." },
  { archetype: 'troll', minQOI: 220, maxQOI: 300, line: "I... I have no jokes. This is perfect." },
  { archetype: 'troll', minQOI: 240, maxQOI: 300, line: "You ended careers with this. Including mine." },
];

// OLD PRO - Prestige perspective, earned respect
export const oldProComments: JudgeComment[] = [
  // Low scores
  { archetype: 'old_pro', minQOI: 0, maxQOI: 80, line: "You have passion. Now learn discipline." },
  { archetype: 'old_pro', minQOI: 0, maxQOI: 80, line: "Every master was once a disaster. Keep going." },
  { archetype: 'old_pro', minQOI: 0, maxQOI: 80, line: "Study the greats. Then study them again." },
  { archetype: 'old_pro', minQOI: 0, maxQOI: 80, line: "The craft takes time. Give it that time." },
  { archetype: 'old_pro', minQOI: 0, maxQOI: 80, line: "Potential without polish. Common at your stage." },
  { archetype: 'old_pro', minQOI: 0, maxQOI: 80, line: "Return in six months. You'll see the difference." },
  
  // Mid scores
  { archetype: 'old_pro', minQOI: 80, maxQOI: 160, line: "Clear artistic intention. Execution needs refinement." },
  { archetype: 'old_pro', minQOI: 80, maxQOI: 160, line: "You're developing a voice. Protect it." },
  { archetype: 'old_pro', minQOI: 80, maxQOI: 160, line: "Polish your transitions. That's where mastery lives." },
  { archetype: 'old_pro', minQOI: 80, maxQOI: 160, line: "Competent work. The question is: what's next?" },
  { archetype: 'old_pro', minQOI: 100, maxQOI: 180, line: "You understand rhythm. Now master dynamics." },
  { archetype: 'old_pro', minQOI: 100, maxQOI: 180, line: "Good taste, good choices. Keep refining." },
  { archetype: 'old_pro', minQOI: 120, maxQOI: 200, line: "This shows growth. Real, measurable growth." },
  { archetype: 'old_pro', minQOI: 120, maxQOI: 200, line: "You're entering the pro conversation now." },
  
  // High scores
  { archetype: 'old_pro', minQOI: 160, maxQOI: 220, line: "This is professional-grade work. Period." },
  { archetype: 'old_pro', minQOI: 160, maxQOI: 220, line: "Maturity in the craft. Rare to see." },
  { archetype: 'old_pro', minQOI: 180, maxQOI: 260, line: "You've earned your place among the elite." },
  { archetype: 'old_pro', minQOI: 180, maxQOI: 260, line: "This is what years of dedication looks like." },
  { archetype: 'old_pro', minQOI: 200, maxQOI: 300, line: "I see a future House founder here." },
  { archetype: 'old_pro', minQOI: 220, maxQOI: 300, line: "Exceptional. True mastery on display." },
  { archetype: 'old_pro', minQOI: 240, maxQOI: 300, line: "This transcends competition. This is art." },
  { archetype: 'old_pro', minQOI: 260, maxQOI: 300, line: "Among the finest work I've reviewed this year." },
  { archetype: 'old_pro', minQOI: 280, maxQOI: 300, line: "Legacy-tier. You will be remembered." },
];

// All comments combined for easy access
export const allComments: JudgeComment[] = [
  ...realistComments,
  ...hypeDemonComments,
  ...coachComments,
  ...trollComments,
  ...oldProComments,
];

// Get a random comment for a given archetype and QOI score
export function getRandomComment(archetype: JudgeArchetype, qoiScore: number): string {
  let comments: JudgeComment[];
  
  switch (archetype) {
    case 'realist':
      comments = realistComments;
      break;
    case 'hype_demon':
      comments = hypeDemonComments;
      break;
    case 'coach':
      comments = coachComments;
      break;
    case 'troll':
      comments = trollComments;
      break;
    case 'old_pro':
      comments = oldProComments;
      break;
    default:
      comments = realistComments;
  }
  
  const validComments = comments.filter(c => qoiScore >= c.minQOI && qoiScore <= c.maxQOI);
  
  if (validComments.length === 0) {
    // Fallback to closest range
    return comments[0].line;
  }
  
  return validComments[Math.floor(Math.random() * validComments.length)].line;
}

// Get archetype display info
export function getArchetypeInfo(archetype: JudgeArchetype): { name: string; description: string; icon: string } {
  switch (archetype) {
    case 'realist':
      return { name: 'The Realist', description: 'Brutal honesty. No sugarcoating.', icon: '⚖️' };
    case 'hype_demon':
      return { name: 'Hype Demon', description: 'Maximum energy when you deliver.', icon: '🔥' };
    case 'coach':
      return { name: 'The Coach', description: 'Tough love with actionable feedback.', icon: '📋' };
    case 'troll':
      return { name: 'The Troll', description: 'Chaos. Memes. Still accurate though.', icon: '💀' };
    case 'old_pro':
      return { name: 'Old Pro', description: 'Prestige perspective. Earned respect.', icon: '👑' };
    default:
      return { name: 'Unknown', description: '', icon: '❓' };
  }
}

// Get rank projection based on QOI score
export function getRankProjection(qoiScore: number): { tier: string; level: number; description: string } {
  if (qoiScore >= 270) return { tier: 'Apex', level: 1, description: 'Top 0.1% — Prestige House eligible' };
  if (qoiScore >= 250) return { tier: 'Elite', level: 1, description: 'Top 1% — Elite League' };
  if (qoiScore >= 230) return { tier: 'Elite', level: 2, description: 'Top 3%' };
  if (qoiScore >= 210) return { tier: 'Elite', level: 3, description: 'Top 5%' };
  if (qoiScore >= 190) return { tier: 'Gold', level: 1, description: 'Top 10%' };
  if (qoiScore >= 170) return { tier: 'Gold', level: 2, description: 'Top 15%' };
  if (qoiScore >= 150) return { tier: 'Gold', level: 3, description: 'Top 25%' };
  if (qoiScore >= 130) return { tier: 'Silver', level: 1, description: 'Top 35%' };
  if (qoiScore >= 110) return { tier: 'Silver', level: 2, description: 'Top 50%' };
  if (qoiScore >= 90) return { tier: 'Silver', level: 3, description: 'Top 65%' };
  if (qoiScore >= 70) return { tier: 'Bronze', level: 1, description: 'Top 80%' };
  if (qoiScore >= 50) return { tier: 'Bronze', level: 2, description: 'Top 90%' };
  return { tier: 'Bronze', level: 3, description: 'Entry Level' };
}
