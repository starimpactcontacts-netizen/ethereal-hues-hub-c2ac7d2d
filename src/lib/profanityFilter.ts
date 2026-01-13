// Profanity filter - censors swear words with hashtags like Roblox
// This list can be expanded as needed

const PROFANITY_LIST = [
  // Common swear words - keeping first letter, rest becomes #
  'fuck', 'fucking', 'fucked', 'fucker', 'fuckin',
  'shit', 'shitting', 'shitty', 'bullshit',
  'bitch', 'bitches', 'bitching',
  'ass', 'asshole', 'asses',
  'damn', 'damned', 'dammit',
  'crap', 'crappy',
  'dick', 'dicks', 'dickhead',
  'cock', 'cocks',
  'pussy', 'pussies',
  'cunt', 'cunts',
  'whore', 'whores',
  'slut', 'sluts',
  'bastard', 'bastards',
  'piss', 'pissed', 'pissing',
  'retard', 'retarded',
  'fag', 'faggot', 'fags',
  'nigger', 'nigga', 'niggas',
  'kike', 'spic', 'chink', 'gook',
  'twat', 'wanker', 'tosser',
  'bollocks', 'bugger', 'arse',
];

// Create regex pattern for each word (case insensitive, word boundaries)
const createPattern = (word: string): RegExp => {
  // Escape special regex characters
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match the word with optional common letter substitutions
  // e.g., @ for a, 1 for i, 0 for o, 3 for e, $ for s
  const flexible = escaped
    .replace(/a/gi, '[a@4]')
    .replace(/e/gi, '[e3]')
    .replace(/i/gi, '[i1!]')
    .replace(/o/gi, '[o0]')
    .replace(/s/gi, '[s$5]')
    .replace(/t/gi, '[t7]');
  return new RegExp(`\\b${flexible}\\b`, 'gi');
};

// Convert word to censored version (keep first letter, rest is #)
const censorWord = (word: string): string => {
  if (word.length <= 1) return '#';
  return word[0] + '#'.repeat(word.length - 1);
};

/**
 * Filters profanity from text, replacing with hashtags
 * Example: "fuck" becomes "f###"
 */
export function filterProfanity(text: string): string {
  let filtered = text;
  
  for (const word of PROFANITY_LIST) {
    const pattern = createPattern(word);
    filtered = filtered.replace(pattern, (match) => censorWord(match));
  }
  
  return filtered;
}

/**
 * Check if text contains profanity
 */
export function containsProfanity(text: string): boolean {
  for (const word of PROFANITY_LIST) {
    const pattern = createPattern(word);
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}
