import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Link2, Video, Globe, ChevronRight } from "lucide-react";
import { useEditorLinkPage, type EditorLink } from "@/hooks/useEditorLinkPage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import LinkTreePreview from "./LinkTreePreview";

const BG_PRESETS = [
  { label: "Midnight", bg_type: "solid", bg_color: "#0a0a0a" },
  { label: "Dark Blue", bg_type: "solid", bg_color: "#0c1220" },
  { label: "Crimson", bg_type: "gradient", bg_gradient_from: "#1a0000", bg_gradient_to: "#0a0a0a" },
  { label: "Gold", bg_type: "gradient", bg_gradient_from: "#1a1400", bg_gradient_to: "#0a0a0a" },
  { label: "Cyber", bg_type: "gradient", bg_gradient_from: "#001a1a", bg_gradient_to: "#0a0a0a" },
  { label: "Purple", bg_type: "gradient", bg_gradient_from: "#150020", bg_gradient_to: "#0a0a0a" },
];

const ACCENT_COLORS = ["#d4af37", "#ef4444", "#3b82f6", "#10b981", "#a855f7", "#f97316", "#ec4899", "#06b6d4"];

export default function LinkTreeEditor() {
  const { profile } = useAuth();
  const { settings, links, loading, saveSettings, addLink, updateLink, removeLink, reorderLinks } = useEditorLinkPage(profile?.id);
  const [showPreview, setShowPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<"link" | "embed">("link");
  const [showStyle, setShowStyle] = useState(false);

  if (loading || !settings) {
    return <div className="flex items-center justify-center py-8"><p className="text-muted-foreground text-xs">Loading...</p></div>;
  }

  const handleAdd = async () => {
    if (!newTitle.trim() || !newUrl.trim()) { toast.error("Title and URL required"); return; }
    await addLink({ title: newTitle, url: newUrl, link_type: newType, embed_url: newType === "embed" ? newUrl : undefined });
    setNewTitle(""); setNewUrl(""); setAdding(false);
    toast.success("Added");
  };

  // Auto-defaults from profile
  const displayTitle = settings.page_title || (profile as any)?.display_name || profile?.username || "My Links";
  const displayBio = settings.bio || "";

  return (
    <div className="space-y-3 pb-6">
      {/* Top bar — minimal */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {links.length} link{links.length !== 1 ? 's' : ''} · {settings.view_count || 0} views
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowPreview(!showPreview)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 rounded-full border border-border/30 hover:border-border/60">
            <Eye className="w-3 h-3" />
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={async () => {
              await saveSettings({ is_published: !settings.is_published });
              toast.success(settings.is_published ? "Unpublished" : "Published!");
            }}
            className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-full border transition-colors ${
              settings.is_published 
                ? "border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60" 
                : "border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60"
            }`}
          >
            <Globe className="w-3 h-3" />
            {settings.is_published ? "Live" : "Publish"}
          </button>
        </div>
      </div>

      {/* Live URL */}
      {settings.is_published && (
        <button
          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/editor/${profile?.username || profile?.id}`); toast.success("Link copied!"); }}
          className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-colors"
        >
          <Globe className="w-3 h-3 shrink-0" />
          <span className="truncate flex-1">loopgate.io/u/{profile?.username || profile?.id}</span>
          <span className="text-emerald-400/60 shrink-0">Copy</span>
        </button>
      )}

      {showPreview ? (
        <LinkTreePreview settings={{ ...settings, page_title: displayTitle, bio: displayBio }} links={links.filter(l => l.is_active)} profile={profile} />
      ) : (
        <>
          {/* ═══ LINKS LIST ═══ */}
          {links.length > 0 ? (
            <Reorder.Group axis="y" values={links} onReorder={reorderLinks} className="space-y-1">
              {links.map((link) => (
                <Reorder.Item key={link.id} value={link}>
                  <div className="flex items-center gap-2 px-2 py-2 bg-surface-1/30 border border-border/20 rounded-lg group hover:border-border/40 transition-colors">
                    <GripVertical className="w-3 h-3 text-muted-foreground/30 cursor-grab shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">{link.title}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => updateLink(link.id, { is_active: !link.is_active })} className="p-1 rounded hover:bg-surface-1 transition-colors">
                        {link.is_active ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                      </button>
                      <button onClick={() => removeLink(link.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div className="text-center py-6">
              <Link2 className="w-5 h-5 mx-auto text-muted-foreground/40 mb-1.5" />
              <p className="text-[10px] text-muted-foreground">No links yet</p>
            </div>
          )}

          {/* Add link — inline fast form */}
          {adding ? (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <div className="space-y-1.5 p-2 border border-border/30 rounded-lg bg-surface-1/20">
                <div className="flex gap-1">
                  <button onClick={() => setNewType("link")} className={`flex-1 py-1 text-[9px] rounded-md flex items-center justify-center gap-1 transition-colors ${newType === "link" ? "bg-foreground/10 text-foreground" : "text-muted-foreground"}`}>
                    <Link2 className="w-2.5 h-2.5" /> Link
                  </button>
                  <button onClick={() => setNewType("embed")} className={`flex-1 py-1 text-[9px] rounded-md flex items-center justify-center gap-1 transition-colors ${newType === "embed" ? "bg-foreground/10 text-foreground" : "text-muted-foreground"}`}>
                    <Video className="w-2.5 h-2.5" /> Embed
                  </button>
                </div>
                <input placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full h-7 px-2 text-[11px] bg-background border border-border/30 rounded-md focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground" />
                <input placeholder={newType === "embed" ? "YouTube / TikTok URL" : "https://..."} value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full h-7 px-2 text-[11px] bg-background border border-border/30 rounded-md focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground" onKeyDown={e => e.key === "Enter" && handleAdd()} />
                <div className="flex gap-1">
                  <button onClick={handleAdd} className="flex-1 h-7 text-[10px] font-medium bg-foreground text-background rounded-md hover:opacity-90 transition-opacity">Add</button>
                  <button onClick={() => setAdding(false)} className="h-7 px-3 text-[10px] text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-1 py-2 text-[10px] text-muted-foreground hover:text-foreground border border-dashed border-border/30 rounded-lg hover:border-border/60 transition-colors">
              <Plus className="w-3 h-3" /> Add link
            </button>
          )}

          {/* ═══ STYLE — collapsible, minimal ═══ */}
          <button onClick={() => setShowStyle(!showStyle)} className="w-full flex items-center justify-between py-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            <span>Customize appearance</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${showStyle ? "rotate-90" : ""}`} />
          </button>

          <AnimatePresence>
            {showStyle && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
                {/* Page title override */}
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1">Page Title <span className="text-muted-foreground/50">(defaults to your display name)</span></p>
                  <input
                    placeholder={displayTitle}
                    defaultValue={settings.page_title || ""}
                    onBlur={e => saveSettings({ page_title: e.target.value || null })}
                    className="w-full h-7 px-2 text-[11px] bg-background border border-border/30 rounded-md focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>

                {/* Bio */}
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1">Bio</p>
                  <textarea
                    placeholder="Tell the world about yourself..."
                    defaultValue={settings.bio || ""}
                    onBlur={e => saveSettings({ bio: e.target.value || null })}
                    className="w-full h-14 px-2 py-1.5 text-[11px] bg-background border border-border/30 rounded-md resize-none focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
                    maxLength={300}
                  />
                </div>

                {/* Background */}
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1">Background</p>
                  <div className="flex gap-1">
                    {BG_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => saveSettings({
                          bg_type: preset.bg_type,
                          bg_color: preset.bg_color || null,
                          bg_gradient_from: (preset as any).bg_gradient_from || null,
                          bg_gradient_to: (preset as any).bg_gradient_to || null,
                        })}
                        className="w-8 h-8 rounded-md border border-border/30 hover:border-border/60 transition-colors"
                        style={{
                          background: preset.bg_type === "gradient"
                            ? `linear-gradient(135deg, ${(preset as any).bg_gradient_from}, ${(preset as any).bg_gradient_to})`
                            : preset.bg_color,
                        }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Accent */}
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1">Accent</p>
                  <div className="flex gap-1.5">
                    {ACCENT_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => saveSettings({ accent_color: color })}
                        className={`w-5 h-5 rounded-full transition-transform ${settings.accent_color === color ? "ring-2 ring-foreground/40 ring-offset-1 ring-offset-background scale-110" : ""}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Toggles — compact */}
                <div className="space-y-1">
                  {([
                    { key: "show_avatar" as const, label: "Avatar" },
                    { key: "show_stats" as const, label: "Stats" },
                    { key: "show_socials" as const, label: "Socials" },
                  ]).map(t => (
                    <button key={t.key} onClick={() => saveSettings({ [t.key]: !settings[t.key] })} className="w-full flex items-center justify-between py-1">
                      <span className="text-[10px] text-muted-foreground">{t.label}</span>
                      <div className={`w-7 h-3.5 rounded-full transition-colors relative ${settings[t.key] ? "bg-emerald-500" : "bg-muted"}`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-transform ${settings[t.key] ? "translate-x-3.5" : "translate-x-0.5"}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
