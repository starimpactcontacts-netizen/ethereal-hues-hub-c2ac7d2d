import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

interface LinkPreviewProps {
  url: string;
}

// Simple in-memory cache to avoid refetching
const previewCache = new Map<string, LinkPreviewData | null>();

export default function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      // Check cache first
      if (previewCache.has(url)) {
        const cached = previewCache.get(url);
        setPreview(cached || null);
        setLoading(false);
        setError(!cached);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.functions.invoke('get-link-preview', {
          body: { url }
        });

        if (fetchError || data?.error) {
          previewCache.set(url, null);
          setError(true);
        } else {
          previewCache.set(url, data);
          setPreview(data);
        }
      } catch (err) {
        console.error('Preview fetch error:', err);
        previewCache.set(url, null);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  // Don't render anything if loading or error
  if (loading) {
    return (
      <div className="mt-2 rounded-lg border border-border/50 bg-muted/30 p-3 animate-pulse">
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-muted rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !preview || (!preview.title && !preview.description)) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 block rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors overflow-hidden group max-w-[280px]"
    >
      {/* Image preview if available - compact */}
      {preview.image && (
        <div className="relative w-full h-20 bg-muted">
          <img 
            src={preview.image} 
            alt="" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-2">
        {/* Site info */}
        <div className="flex items-center gap-1.5 mb-0.5">
          {preview.favicon && (
            <img 
              src={preview.favicon} 
              alt="" 
              className="w-3 h-3 rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="text-[10px] text-muted-foreground truncate">
            {preview.siteName}
          </span>
          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
        </div>

        {/* Title */}
        {preview.title && (
          <h4 className="text-xs font-medium text-foreground line-clamp-1">
            {preview.title}
          </h4>
        )}

        {/* Description */}
        {preview.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}
