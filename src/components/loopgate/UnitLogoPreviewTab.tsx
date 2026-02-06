import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Check, X, Trash2, Crown, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLogoPreview } from "@/hooks/useLogoPreview";
import { formatDistanceToNow } from "date-fns";

interface Props {
  crewId: string;
  isStaff: boolean;
}

const PREVIEW_STYLES = [
  { label: "Default", className: "rounded-xl" },
  { label: "Circle", className: "rounded-full" },
  { label: "Square", className: "rounded-none" },
  { label: "Badge", className: "rounded-lg w-16 h-16" },
];

export default function UnitLogoPreviewTab({ crewId, isStaff }: Props) {
  const { previews, loading, uploadPreview, vote, updateStatus, deletePreview } = useLogoPreview(crewId);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStyle, setSelectedStyle] = useState(0);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadPreview(file, title || undefined);
    setUploading(false);
    setTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const activePreviews = previews.filter((p) => p.status === "active");
  const resolvedPreviews = previews.filter((p) => p.status !== "active");

  return (
    <div className="space-y-5 pb-20">
      {/* Upload Section (Staff Only) */}
      {isStaff && (
        <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-gold" />
            Upload Logo Mockup
          </h3>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="h-9 text-sm"
          />
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 gap-2"
            >
              <ImagePlus className="w-4 h-4" />
              Choose Image
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={uploading || !fileInputRef.current?.files?.length}
              className="bg-gold text-black hover:bg-gold/90 font-semibold"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      )}

      {/* Style Selector */}
      {activePreviews.length > 0 && (
        <div className="flex gap-2">
          {PREVIEW_STYLES.map((style, i) => (
            <button
              key={style.label}
              onClick={() => setSelectedStyle(i)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedStyle === i
                  ? "bg-gold/20 border-gold/50 text-gold"
                  : "bg-surface-1 border-border text-muted-foreground"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      )}

      {/* Active Previews */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activePreviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <ImagePlus className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-display text-lg text-muted-foreground mb-2">No Logo Previews</h3>
          <p className="text-xs text-muted-foreground/60 max-w-xs">
            {isStaff ? "Upload logo mockups for your unit members to vote on." : "No logo previews to vote on yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activePreviews.map((preview, index) => (
            <motion.div
              key={preview.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-surface-1 border border-border rounded-xl overflow-hidden"
            >
              {/* Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="font-semibold text-sm">{preview.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(preview.created_at), { addSuffix: true })}
                  </span>
                  {preview.total_votes > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {preview.total_votes} vote{preview.total_votes !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Image Preview with style options */}
              <div className="p-6 flex items-center justify-center bg-[#111] min-h-[200px]">
                <img
                  src={preview.image_url}
                  alt={preview.title}
                  className={`max-h-48 object-contain transition-all ${PREVIEW_STYLES[selectedStyle].className}`}
                />
              </div>

              {/* Dark mode preview strip */}
              <div className="flex gap-3 px-4 py-3 bg-background/50 border-t border-border overflow-x-auto">
                {PREVIEW_STYLES.map((style, i) => (
                  <div key={style.label} className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-10 h-10 bg-[#111] flex items-center justify-center ${style.className} overflow-hidden border border-border`}>
                      <img src={preview.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] text-muted-foreground">{style.label}</span>
                  </div>
                ))}
              </div>

              {/* Vote Reactions */}
              <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-t border-border">
                {preview.votes.map((v) => (
                  <button
                    key={v.emoji}
                    onClick={() => vote(preview.id, v.emoji)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      v.voted
                        ? "bg-gold/20 border border-gold/50"
                        : "bg-surface-2 border border-border hover:border-gold/30"
                    }`}
                  >
                    <span>{v.emoji}</span>
                    {v.count > 0 && <span className="text-xs font-medium">{v.count}</span>}
                  </button>
                ))}
              </div>

              {/* Staff Actions */}
              {isStaff && (
                <div className="px-4 py-3 flex gap-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-green-400 border-green-400/30 hover:bg-green-400/10 gap-1"
                    onClick={() => updateStatus(preview.id, "approved")}
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-400 border-red-400/30 hover:bg-red-400/10 gap-1"
                    onClick={() => updateStatus(preview.id, "discarded")}
                  >
                    <X className="w-4 h-4" />
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => deletePreview(preview.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Resolved Previews */}
      {resolvedPreviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past Previews</h3>
          {resolvedPreviews.map((p) => (
            <div key={p.id} className="bg-surface-1 border border-border rounded-xl p-3 flex items-center gap-3 opacity-60">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#111] shrink-0">
                <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.total_votes} votes</p>
              </div>
              <Badge
                variant="secondary"
                className={p.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
              >
                {p.status === "approved" ? "✅ Approved" : "Discarded"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
