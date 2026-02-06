import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  quickEmojis?: string[];
  showQuickBar?: boolean;
}

// Apple-style emoji categories with common emojis
const EMOJI_DATA = {
  "Smileys": [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", 
    "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", 
    "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐",
    "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪",
    "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶",
    "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕",
    "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧",
    "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓",
    "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀",
    "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖"
  ],
  "Gestures": [
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
    "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍",
    "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝",
    "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂",
    "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄"
  ],
  "People": [
    "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "👩", "🧓",
    "👴", "👵", "🙍", "🙎", "🙅", "🙆", "💁", "🙋", "🧏", "🙇",
    "🤦", "🤷", "👮", "🕵️", "💂", "🥷", "👷", "🤴", "👸", "👳",
    "👲", "🧕", "🤵", "👰", "🤰", "🤱", "👼", "🎅", "🤶", "🦸",
    "🦹", "🧙", "🧚", "🧛", "🧜", "🧝", "🧞", "🧟", "💆", "💇"
  ],
  "Hearts": [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️"
  ],
  "Animals": [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
    "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊",
    "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉",
    "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌",
    "🐞", "🐜", "🦟", "🦗", "🪳", "🕷️", "🦂", "🐢", "🐍", "🦎"
  ],
  "Food": [
    "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
    "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
    "🌶️", "🫑", "🥒", "🥬", "🥦", "🧄", "🧅", "🍄", "🥜", "🌰",
    "🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖",
    "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯"
  ],
  "Activities": [
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
    "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳",
    "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷",
    "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "🤺"
  ],
  "Objects": [
    "🔥", "💥", "✨", "🌟", "⭐", "🌈", "☀️", "🌙", "⚡", "❄️",
    "💧", "🌊", "🎵", "🎶", "🎤", "🎧", "🎬", "🎨", "🎭", "🎪",
    "🎰", "🎲", "🧩", "🎯", "🎳", "🎮", "🕹️", "🎻", "🪘", "🎹",
    "🎺", "🎷", "🪗", "🎸", "📱", "💻", "🖥️", "📷", "📹", "🎥"
  ],
  "Symbols": [
    "💯", "💢", "💬", "👁️‍🗨️", "🗯️", "💭", "💤", "💮", "♨️", "💈",
    "🛑", "🕛", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗",
    "✅", "❌", "❓", "❗", "‼️", "⁉️", "〰️", "💱", "💲", "⚕️",
    "♻️", "⚜️", "🔱", "📛", "🔰", "⭕", "✅", "☑️", "✔️", "❌"
  ]
};

// Twemoji CDN for Apple-style emojis
const getTwemojiUrl = (emoji: string) => {
  const codePoints = [...emoji]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter(Boolean)
    .join("-")
    .replace(/-fe0f/g, ""); // Remove variation selector
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoints}.png`;
};

// Emoji component with Twemoji fallback
function Emoji({ emoji, size = 24 }: { emoji: string; size?: number }) {
  const [useFallback, setUseFallback] = useState(false);
  
  if (useFallback) {
    return <span style={{ fontSize: size }}>{emoji}</span>;
  }
  
  return (
    <img
      src={getTwemojiUrl(emoji)}
      alt={emoji}
      width={size}
      height={size}
      className="inline-block"
      onError={() => setUseFallback(true)}
      loading="lazy"
    />
  );
}

const DEFAULT_QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "💀", "👀"];

export default function EmojiPicker({ onSelect, quickEmojis = DEFAULT_QUICK_EMOJIS, showQuickBar = true }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [showFull, setShowFull] = useState(false);

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return EMOJI_DATA;
    
    const query = search.toLowerCase();
    const results: Record<string, string[]> = {};
    
    Object.entries(EMOJI_DATA).forEach(([category, emojis]) => {
      const filtered = emojis.filter((emoji) => {
        // Simple search - can be expanded with emoji names
        return emoji.includes(query) || category.toLowerCase().includes(query);
      });
      if (filtered.length > 0) {
        results[category] = filtered;
      }
    });
    
    return results;
  }, [search]);

  if (!showFull) {
    // Quick emoji bar with + button
    return (
      <div className="flex items-center gap-1 bg-card border border-border/60 rounded-lg p-1.5">
        {showQuickBar && quickEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors"
          >
            <Emoji emoji={emoji} size={22} />
          </button>
        ))}
        <button
          onClick={() => setShowFull(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors border border-border/40"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  // Full emoji picker
  return (
    <div className="bg-card border border-border/60 rounded-lg w-72 overflow-hidden">
      {/* Search bar */}
      <div className="p-2 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-muted/30 border-border/40"
            autoFocus
          />
        </div>
      </div>

      {/* Emoji grid */}
      <ScrollArea className="h-64">
        <div className="p-2">
          {Object.entries(filteredEmojis).map(([category, emojis]) => (
            <div key={category} className="mb-3">
              <div className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5 px-1">
                {category}
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSelect(emoji);
                      setShowFull(false);
                      setSearch("");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted/60 transition-colors"
                  >
                    <Emoji emoji={emoji} size={20} />
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {Object.keys(filteredEmojis).length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground/60">
              No emojis found
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Back button */}
      <div className="p-2 border-t border-border/40">
        <button
          onClick={() => {
            setShowFull(false);
            setSearch("");
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to quick emojis
        </button>
      </div>
    </div>
  );
}

export { Emoji, getTwemojiUrl };
