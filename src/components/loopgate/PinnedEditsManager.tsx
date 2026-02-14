import { useState } from "react";
import { Plus, Trash2, Link, Loader2 } from "lucide-react";
import { usePinnedEditsManager } from "@/hooks/usePinnedEdits";
import { toast } from "sonner";
import ThumbnailImage from "./ThumbnailImage";

interface Props {
  userId: string;
}

export default function PinnedEditsManager({ userId }: Props) {
  const { edits, loading, saving, addPinnedEdit, removePinnedEdit } = usePinnedEditsManager(userId);
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("tiktok");

  async function handleAdd() {
    if (!url.trim()) {
      toast.error("URL is required");
      return;
    }
    const result = await addPinnedEdit({ title: title.trim() || undefined, platform, url: url.trim() });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Edit pinned!");
      setUrl("");
      setTitle("");
      setShowAdd(false);
      // Force reload
      window.location.reload();
    }
  }

  async function handleRemove(editId: string) {
    await removePinnedEdit(editId);
    toast.success("Edit unpinned");
    window.location.reload();
  }

  if (loading) return null;

  return (
    <div className="border-t border-border/30 pt-5 mt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg text-foreground">Pinned Edits</h3>
        <span className="text-[10px] text-muted-foreground">{edits.length}/3</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">
        Showcase your best edits on the Discover feed. Max 3.
      </p>

      {/* Existing pinned edits */}
      {edits.length > 0 && (
        <div className="space-y-2 mb-4">
          {edits.map((edit) => (
            <div key={edit.id} className="flex items-center gap-3 bg-surface-1/40 border border-border/30 p-3 rounded-md">
              {edit.thumbnail_url ? (
                <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-surface-0">
                  <ThumbnailImage src={edit.thumbnail_url} alt={edit.title || "Edit"} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-10 rounded bg-surface-0 flex items-center justify-center flex-shrink-0">
                  <Link className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{edit.title || edit.url}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{edit.platform}</p>
              </div>
              <button
                onClick={() => handleRemove(edit.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      {edits.length < 3 && !showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors rounded-md flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Pin an Edit
        </button>
      )}

      {showAdd && (
        <div className="bg-surface-1/40 border border-border/30 p-4 rounded-md space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-surface-0 border border-border/50 px-3 py-2 text-sm rounded-md focus:outline-none focus:border-foreground/30"
            >
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="streamable">Streamable</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Video URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/..."
              className="w-full bg-surface-0 border border-border/50 px-3 py-2 text-sm rounded-md focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My best edit"
              className="w-full bg-surface-0 border border-border/50 px-3 py-2 text-sm rounded-md focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground/40"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 py-2.5 bg-foreground text-background font-bold text-xs uppercase tracking-wider rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Pin Edit
            </button>
            <button
              onClick={() => { setShowAdd(false); setUrl(""); setTitle(""); }}
              className="px-4 py-2.5 border border-border/50 text-muted-foreground text-xs uppercase tracking-wider rounded-md hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
