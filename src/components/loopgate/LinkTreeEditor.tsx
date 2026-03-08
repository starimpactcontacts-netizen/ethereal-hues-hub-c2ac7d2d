import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Link2, Video, Globe, ChevronRight, ExternalLink, Copy } from "lucide-react";
import { useEditorLinkPage, type EditorLink } from "@/hooks/useEditorLinkPage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import LinkTreePreview from "./LinkTreePreview";
import GateIcon from "./GateIcon";

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
  const [mode, setMode] = useState<'overview' | 'edit' | 'preview' | 'style'>('overview');
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<"link" | "embed">("link");

  if (loading || !settings) {
    return <div className="flex items-center justify-center py-8"><p className="text-muted-foreground text-xs">Loading...</p></div>;
  }

  const displayTitle = settings.page_title || (profile as any)?.display_name || profile?.username || "My Links";
  const displayBio = settings.bio || "";
  const linkUrl = `loopgate.io/${profile?.username || profile?.id}`;
  const fullUrl = `${window.location.origin}/editor/${profile?.username || profile?.id}`;

  const handleAdd = async () => {
    if (!newTitle.trim() || !newUrl.trim()) { toast.error("Title and URL required"); return; }
    await addLink({ title: newTitle, url: newUrl, link_type: newType, embed_url: newType === "embed" ? newUrl : undefined });
    setNewTitle(""); setNewUrl(""); setAdding(false);
    toast.success("Added");
  };

  const copyLink = () => { navigator.clipboard.writeText(fullUrl); toast.success("Link copied!"); };

  // ═══ OVERVIEW — what users see first ═══
  if (mode === 'overview') {
    return (
      <div className="space-y-3 pb-6">
        {/* Hero card — shows what their link page looks like */}
        <div className="relative overflow-hidden rounded-xl border border-border/20">
          {/* Mini preview */}
          <div className="relative h-44 overflow-hidden" style={{
            background: settings.bg_type === "gradient" && settings.bg_gradient_from
              ? `linear-gradient(180deg, ${settings.bg_gradient_from} 0%, ${settings.bg_gradient_to} 100%)`
              : settings.bg_color || "#0a0a0a",
          }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              {/* Mini avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden mb-1.5" style={{ border: `1.5px solid ${settings.accent_color || '#d4af37'}` }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/20">
                    <span className="text-sm font-bold text-white/60">{(profile?.username || '?').charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <p className="text-white text-[13px] font-bold" style={{ fontFamily: "Teko, sans-serif" }}>{displayTitle}</p>
              <p className="text-white/40 text-[9px]">@{profile?.username}</p>
              
              {/* Mini link pills */}
              <div className="mt-2 space-y-1 w-full max-w-[200px]">
                {links.slice(0, 3).map(l => (
                  <div key={l.id} className="w-full h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-[7px] text-white/50 truncate px-2">{l.title}</span>
                  </div>
                ))}
                {links.length === 0 && (
                  <>
                    <div className="w-full h-5 rounded bg-white/5 border border-white/10 border-dashed" />
                    <div className="w-full h-5 rounded bg-white/5 border border-white/10 border-dashed" />
                  </>
                )}
              </div>

              {/* Powered by */}
              <div className="mt-2 flex items-center gap-1 opacity-20">
                <GateIcon size={7} color="#fff" />
                <span className="text-[6px] text-white tracking-wider uppercase">Powered by Loopgate</span>
              </div>
            </div>
          </div>

          {/* URL bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-1/50 border-t border-border/10">
            <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground flex-1 truncate">{linkUrl}</span>
            <button onClick={copyLink} className="text-[9px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
              <Copy className="w-2.5 h-2.5" /> Copy
            </button>
          </div>
        </div>

        {/* Status + publish */}
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await saveSettings({ is_published: !settings.is_published });
              toast.success(settings.is_published ? "Unpublished" : "Your link page is live!");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-colors ${
              settings.is_published
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-foreground text-background"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            {settings.is_published ? "Live · Unpublish" : "Publish Link Page"}
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex items-center justify-center gap-4 text-center">
          <div>
            <p className="text-sm font-bold">{links.length}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Links</p>
          </div>
          <div className="w-px h-6 bg-border/20" />
          <div>
            <p className="text-sm font-bold">{settings.view_count || 0}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Views</p>
          </div>
          <div className="w-px h-6 bg-border/20" />
          <div>
            <p className="text-sm font-bold">{links.reduce((sum, l) => sum + (l.click_count || 0), 0)}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Clicks</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-1">
          <button onClick={() => setMode('edit')} className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-1/30 border border-border/20 rounded-lg hover:border-border/40 transition-colors">
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium">Edit Links</span>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={() => setMode('style')} className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-1/30 border border-border/20 rounded-lg hover:border-border/40 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: settings.accent_color || '#d4af37' }} />
              <span className="text-[11px] font-medium">Customize Style</span>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </button>
          <button onClick={() => setMode('preview')} className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-1/30 border border-border/20 rounded-lg hover:border-border/40 transition-colors">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium">Full Preview</span>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // ═══ FULL PREVIEW ═══
  if (mode === 'preview') {
    return (
      <div className="space-y-2 pb-6">
        <button onClick={() => setMode('overview')} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">← Back</button>
        <LinkTreePreview settings={{ ...settings, page_title: displayTitle, bio: displayBio }} links={links.filter(l => l.is_active)} profile={profile} />
      </div>
    );
  }

  // ═══ STYLE EDITOR ═══
  if (mode === 'style') {
    return (
      <div className="space-y-3 pb-6">
        <button onClick={() => setMode('overview')} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">← Back</button>

        {/* Page title override */}
        <div>
          <p className="text-[9px] text-muted-foreground mb-1">Page Title <span className="text-muted-foreground/50">(defaults to display name)</span></p>
          <input
            placeholder={displayTitle}
            defaultValue={settings.page_title || ""}
            onBlur={e => saveSettings({ page_title: e.target.value || null })}
            className="w-full h-7 px-2 text-[11px] bg-background border border-border/30 rounded-md focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>

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
                onClick={() => saveSettings({ bg_type: preset.bg_type, bg_color: preset.bg_color || null, bg_gradient_from: (preset as any).bg_gradient_from || null, bg_gradient_to: (preset as any).bg_gradient_to || null })}
                className="w-8 h-8 rounded-md border border-border/30 hover:border-border/60 transition-colors"
                style={{ background: preset.bg_type === "gradient" ? `linear-gradient(135deg, ${(preset as any).bg_gradient_from}, ${(preset as any).bg_gradient_to})` : preset.bg_color }}
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

        {/* Toggles */}
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
      </div>
    );
  }

  // ═══ EDIT LINKS ═══
  return (
    <div className="space-y-2 pb-6">
      <button onClick={() => setMode('overview')} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">← Back</button>

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
                <span className="text-[8px] text-muted-foreground/40 tabular-nums">{link.click_count}</span>
                <button onClick={() => updateLink(link.id, { is_active: !link.is_active })} className="p-1 rounded hover:bg-surface-1 transition-colors">
                  {link.is_active ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                </button>
                <button onClick={() => removeLink(link.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="text-center py-6">
          <Link2 className="w-5 h-5 mx-auto text-muted-foreground/40 mb-1.5" />
          <p className="text-[10px] text-muted-foreground">No links yet — add your first one below</p>
        </div>
      )}

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
    </div>
  );
}
