import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

interface TenorGif {
  id: string;
  media_formats: {
    gif: { url: string };
    tinygif: { url: string };
    nanogif: { url: string };
  };
  content_description: string;
}

// Tenor API with anonymous access (limited but works for basic usage)
const TENOR_API_KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"; // Google's public Tenor key
const TENOR_BASE_URL = "https://tenor.googleapis.com/v2";

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [search, setSearch] = useState("reaction");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories] = useState(["reaction", "meme", "funny", "shocked", "sad", "happy", "anime"]);

  const fetchGifs = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const endpoint = query 
        ? `${TENOR_BASE_URL}/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=30&media_filter=gif,tinygif`
        : `${TENOR_BASE_URL}/featured?key=${TENOR_API_KEY}&limit=30&media_filter=gif,tinygif`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      setGifs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGifs("");
  }, [fetchGifs]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (search.trim()) {
        fetchGifs(search);
      } else {
        fetchGifs("");
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, fetchGifs]);

  const handleCategoryClick = (category: string) => {
    setSearch(category);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden z-[100] max-h-[60vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-sm font-medium">GIFs</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search Tenor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-0"
          />
        </div>
        
        {/* Category chips */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-2.5 py-1 text-xs rounded-full shrink-0 transition-colors ${
                search === cat 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GIF Grid */}
      <ScrollArea className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No GIFs found
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.media_formats.tinygif?.url || gif.media_formats.gif?.url)}
                className="aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={gif.media_formats.nanogif?.url || gif.media_formats.tinygif?.url}
                  alt={gif.content_description}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Tenor attribution */}
      <div className="p-2 border-t border-border flex justify-center">
        <span className="text-[10px] text-muted-foreground">Powered by Tenor</span>
      </div>
    </div>
  );
}
