import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, Reorder } from "framer-motion";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Link2, Video, Globe, ChevronRight, Copy } from "lucide-react";
import { useEditorLinkPage } from "@/hooks/useEditorLinkPage";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import LinkTreePreview from "./LinkTreePreview";
import GateIcon from "./GateIcon";

const BG_PRESETS = [
  { label: "Midnight", bg_type: "solid", bg_color: "#0a0a0a" },
  { label: "Obsidian", bg_type: "solid", bg_color: "#0c0c0c" },
  { label: "Dark Blue", bg_type: "solid", bg_color: "#0c1220" },
  { label: "White", bg_type: "solid", bg_color: "#ffffff" },
  { label: "Cream", bg_type: "solid", bg_color: "#faf5ef" },
  { label: "Blush", bg_type: "solid", bg_color: "#fce4ec" },
  { label: "Crimson", bg_type: "gradient", bg_gradient_from: "#1a0000", bg_gradient_to: "#0a0a0a" },
  { label: "Gold Rush", bg_type: "gradient", bg_gradient_from: "#1a1400", bg_gradient_to: "#0a0a0a" },
  { label: "Cyber", bg_type: "gradient", bg_gradient_from: "#001a1a", bg_gradient_to: "#0a0a0a" },
  { label: "Purple Haze", bg_type: "gradient", bg_gradient_from: "#150020", bg_gradient_to: "#0a0a0a" },
  { label: "Neon", bg_type: "gradient", bg_gradient_from: "#001a0a", bg_gradient_to: "#0a0a0a" },
  { label: "Sunset", bg_type: "gradient", bg_gradient_from: "#f8a4c8", bg_gradient_to: "#f06868" },
  { label: "Ocean", bg_type: "gradient", bg_gradient_from: "#0f4c75", bg_gradient_to: "#3282b8" },
  { label: "Lavender", bg_type: "gradient", bg_gradient_from: "#c4b5fd", bg_gradient_to: "#818cf8" },
  { label: "Peach", bg_type: "gradient", bg_gradient_from: "#fcd5ce", bg_gradient_to: "#f8ad9d" },
  { label: "Forest", bg_type: "gradient", bg_gradient_from: "#0b3d0b", bg_gradient_to: "#1a5c1a" },
];

const ACCENT_COLORS = ["#d4af37", "#ef4444", "#3b82f6", "#10b981", "#a855f7", "#f97316", "#ec4899", "#06b6d4", "#f59e0b", "#14b8a6"];

const CARD_STYLES = [
  { value: "default", label: "Glass" },
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "minimal", label: "Minimal" },
];

export default function LinkTreeEditor() {
  const navigate = useNavigate();
  const { profile, session } = useAuth();
  const editorUserId = session?.user?.id;
  const { settings, links, loading, saveSettings, addLink, updateLink, removeLink, reorderLinks } = useEditorLinkPage(editorUserId);

  const [mode, setMode] = useState<'overview' | 'edit' | 'preview' | 'style'>('overview');
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<"link" | "embed">("link");

  if (!editorUserId) {
    return (
      <div className="py-8 px-4 border border-border/30 rounded-xl bg-surface-1/20 text-center">
        <p className="text-sm font-semibold">Sign in required</p>
        <p className="text-xs text-muted-foreground mt-1">You need to sign in again to add and manage links.</p>
        <button
          onClick={() => navigate("/start")}
          className="mt-3 h-8 px-4 rounded-lg bg-foreground text-background text-xs font-medium"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0.15s" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
    );
  }

  const displayTitle = settings.page_title || (profile as any)?.display_name || profile?.username || "My Links";
  const displayBio = settings.bio || "";
  const linkUrl = `loopgate.io/${profile?.username || profile?.id}`;
  const fullUrl = `${window.location.origin}/editor/${profile?.username || profile?.id}`;
  const accentColor = settings.accent_color || "#d4af37";

  const handleAdd = async () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error("Title and URL required");
      return;
    }

    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const added = await addLink({
      title: newTitle.trim(),
      url,
      link_type: newType,
      embed_url: newType === "embed" ? url : undefined,
    });

    if (!added) return;

    setNewTitle("");
    setNewUrl("");
    setAdding(false);
    toast.success("Link added!");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied!");
  };

  if (mode === 'overview') {
    return (
      <div className="space-y-3 pb-6">
        <div className="relative overflow-hidden rounded-xl border border-border/20">
          <div
            className="relative h-48 overflow-hidden"
            style={{
              background: settings.bg_type === "gradient" && settings.bg_gradient_from
                ? `linear-gradient(180deg, ${settings.bg_gradient_from} 0%, ${settings.bg_gradient_to} 100%)`
                : settings.bg_color || "#0a0a0a",
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-[80px] opacity-15 pointer-events-none" style={{ backgroundColor: accentColor }} />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div className="relative mb-2">
                <div className="absolute inset-0 rounded-full blur-md opacity-25" style={{ backgroundColor: accentColor, transform: "scale(1.3)" }} />
                <div className="relative w-12 h-12 rounded-full overflow-hidden" style={{ border: `2px solid ${accentColor}`, boxShadow: `0 0 16px ${accentColor}22` }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}18` }}>
                      <span className="text-base font-black text-white/70" style={{ fontFamily: "Teko, sans-serif" }}>
                        {(profile?.username || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-white text-sm font-black uppercase tracking-wide" style={{ fontFamily: "Teko, sans-serif" }}>{displayTitle}</p>
              <p className="text-white/35 text-[9px]">@{profile?.username}</p>

              <div className="mt-2.5 space-y-1 w-full max-w-[180px]">
                {links.slice(0, 3).map(l => (
                  <div key={l.id} className="w-full h-6 rounded-lg flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-[8px] text-white/50 truncate px-3">{l.title}</span>
                  </div>
                ))}
                {links.length === 0 && (
                  <>
                    <div className="w-full h-6 rounded-lg border border-dashed" style={{ borderColor: `${accentColor}25`, backgroundColor: `${accentColor}05` }} />
                    <div className="w-full h-6 rounded-lg border border-dashed" style={{ borderColor: `${accentColor}15`, backgroundColor: `${accentColor}03` }} />
                  </>
                )}
              </div>

              <div className="mt-2.5 flex items-center gap-1 opacity-20">
                <GateIcon size={7} color="#fff" />
                <span className="text-[6px] text-white tracking-[0.15em] uppercase font-medium">Powered by Loopgate</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-surface-1/50 border-t border-border/10">
            <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground flex-1 truncate">{linkUrl}</span>
            <button onClick={copyLink} className="text-[9px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5">
              <Copy className="w-2.5 h-2.5" /> Copy
            </button>
          </div>
        </div>

        <button
          onClick={async () => {
            await saveSettings({ is_published: !settings.is_published });
            toast.success(settings.is_published ? "Unpublished" : "Your link page is live!");
          }}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[11px] font-semibold transition-all ${
            settings.is_published
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15"
              : "text-background hover:opacity-90"
          }`}
          style={!settings.is_published ? { backgroundColor: accentColor } : undefined}
        >
          <Globe className="w-3.5 h-3.5" />
          {settings.is_published ? "Live · Unpublish" : "Publish Link Page"}
        </button>

        <div className="flex items-center justify-center gap-5 text-center py-1">
          {[
            { val: links.length, label: "Links" },
            { val: settings.view_count || 0, label: "Views" },
            { val: links.reduce((sum, l) => sum + (l.click_count || 0), 0), label: "Clicks" },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-5">
              {i > 0 && <div className="w-px h-5 bg-border/20" />}
              <div>
                <p className="text-sm font-bold tabular-nums">{s.val}</p>
                <p className="text-[7px] text-muted-foreground uppercase tracking-[0.15em]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {[
            { key: 'edit' as const, icon: <Link2 className="w-3.5 h-3.5 text-muted-foreground" />, label: "Edit Links", desc: `${links.length} link${links.length !== 1 ? 's' : ''}` },
            { key: 'style' as const, icon: <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: accentColor }} />, label: "Customize Style", desc: "Colors, layout & more" },
            { key: 'preview' as const, icon: <Eye className="w-3.5 h-3.5 text-muted-foreground" />, label: "Full Preview", desc: "See how visitors see it" },
          ].map(action => (
            <button key={action.key} onClick={() => setMode(action.key)} className="w-full flex items-center justify-between px-3 py-3 bg-surface-1/30 border border-border/20 rounded-lg hover:border-border/40 transition-all hover:bg-surface-1/50 group">
              <div className="flex items-center gap-2.5">
                {action.icon}
                <div className="text-left">
                  <span className="text-[11px] font-semibold block">{action.label}</span>
                  <span className="text-[9px] text-muted-foreground/60">{action.desc}</span>
                </div>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'preview') {
    return (
      <div className="space-y-2 pb-6">
        <button onClick={() => setMode('overview')} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">← Back to overview</button>
        <LinkTreePreview settings={{ ...settings, page_title: displayTitle, bio: displayBio }} links={links.filter(l => l.is_active)} profile={profile} />
      </div>
    );
  }

  if (mode === 'style') {
    return (
      <div className="space-y-4 pb-6">
        <button onClick={() => setMode('overview')} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">← Back to overview</button>

        <div>
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Page Title</label>
          <input
            placeholder={displayTitle}
            defaultValue={settings.page_title || ""}
            onBlur={e => saveSettings({ page_title: e.target.value || null })}
            className="w-full h-8 px-3 text-[11px] bg-background border border-border/30 rounded-lg focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>

        <div>
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Bio</label>
          <textarea
            placeholder="Tell the world about yourself..."
            defaultValue={settings.bio || ""}
            onBlur={e => saveSettings({ bio: e.target.value || null })}
            className="w-full h-16 px-3 py-2 text-[11px] bg-background border border-border/30 rounded-lg resize-none focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
            maxLength={300}
          />
        </div>

        <div>
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Background</label>
          <div className="grid grid-cols-4 gap-1.5">
            {BG_PRESETS.map(preset => {
              const isActive = settings.bg_color === preset.bg_color && settings.bg_type === preset.bg_type;
              return (
                <button
                  key={preset.label}
                  onClick={() => saveSettings({ bg_type: preset.bg_type, bg_color: (preset as any).bg_color || null, bg_gradient_from: (preset as any).bg_gradient_from || null, bg_gradient_to: (preset as any).bg_gradient_to || null })}
                  className={`h-10 rounded-lg border transition-all ${isActive ? "ring-2 ring-foreground/30 ring-offset-1 ring-offset-background scale-105" : "border-border/30 hover:border-border/60"}`}
                  style={{ background: preset.bg_type === "gradient" ? `linear-gradient(135deg, ${(preset as any).bg_gradient_from}, ${(preset as any).bg_gradient_to})` : preset.bg_color }}
                  title={preset.label}
                >
                  <span className="text-[7px] text-white/40 font-medium">{preset.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2">
            <label className="text-[9px] text-muted-foreground mb-1 block uppercase tracking-wider font-medium">Custom Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                defaultValue={settings.bg_color || "#0a0a0a"}
                onChange={e => saveSettings({ bg_type: "solid", bg_color: e.target.value, bg_gradient_from: null, bg_gradient_to: null })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-border/30 bg-transparent"
              />
              <span className="text-[9px] text-muted-foreground">Pick any color</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Custom Avatar URL</label>
          <input
            placeholder="https://... (leave empty for profile avatar)"
            defaultValue={settings.custom_avatar_url || ""}
            onBlur={e => saveSettings({ custom_avatar_url: e.target.value || null })}
            className="w-full h-8 px-3 text-[11px] bg-background border border-border/30 rounded-lg focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>

        <div>
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Background Image URL</label>
          <input
            placeholder="https://... (overrides color/gradient)"
            defaultValue={settings.bg_image_url || ""}
            onBlur={e => {
              if (e.target.value) {
                saveSettings({ bg_type: "image", bg_image_url: e.target.value });
              } else {
                saveSettings({ bg_image_url: null });
              }
            }}
            className="w-full h-8 px-3 text-[11px] bg-background border border-border/30 rounded-lg focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
          />
        </div>

        <div>
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Accent Color</label>
          <div className="flex gap-2 flex-wrap items-center">
            {ACCENT_COLORS.map(color => (
              <button
                key={color}
                onClick={() => saveSettings({ accent_color: color })}
                className={`w-6 h-6 rounded-full transition-all ${settings.accent_color === color ? "ring-2 ring-foreground/40 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                style={{ backgroundColor: color, boxShadow: settings.accent_color === color ? `0 0 12px ${color}40` : undefined }}
              />
            ))}
            <input
              type="color"
              defaultValue={settings.accent_color || "#d4af37"}
              onChange={e => saveSettings({ accent_color: e.target.value })}
              className="w-6 h-6 rounded-full cursor-pointer border border-border/30 bg-transparent"
              title="Custom accent"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Text Color</label>
          <div className="flex gap-2 items-center">
            {["#ffffff", "#000000", "#f5f5f5", "#1a1a1a", "#d4af37"].map(c => (
              <button key={c} onClick={() => saveSettings({ text_color: c })} className={`w-6 h-6 rounded-full border transition-all ${settings.text_color === c ? "ring-2 ring-foreground/40 ring-offset-2 ring-offset-background scale-110" : "border-border/30 hover:scale-105"}`} style={{ backgroundColor: c }} />
            ))}
            <input
              type="color"
              defaultValue={settings.text_color || "#ffffff"}
              onChange={e => saveSettings({ text_color: e.target.value })}
              className="w-6 h-6 rounded-full cursor-pointer border border-border/30 bg-transparent"
              title="Custom text color"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Link Style</label>
          <div className="grid grid-cols-4 gap-1.5">
            {CARD_STYLES.map(s => (
              <button
                key={s.value}
                onClick={() => saveSettings({ card_style: s.value })}
                className={`py-2 rounded-lg text-[10px] font-medium transition-all border ${settings.card_style === s.value ? "bg-foreground/10 border-foreground/20 text-foreground" : "border-border/20 text-muted-foreground hover:border-border/40"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-medium">Visibility</label>
          {([
            { key: "show_avatar" as const, label: "Show Avatar" },
            { key: "show_stats" as const, label: "Show Stats" },
            { key: "show_socials" as const, label: "Show Socials" },
          ]).map(t => (
            <button key={t.key} onClick={() => saveSettings({ [t.key]: !settings[t.key] })} className="w-full flex items-center justify-between py-1.5 px-1">
              <span className="text-[10px] text-muted-foreground">{t.label}</span>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${settings[t.key] ? "bg-emerald-500" : "bg-muted"}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${settings[t.key] ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-6">
      <button onClick={() => setMode('overview')} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">← Back to overview</button>

      {links.length > 0 ? (
        <Reorder.Group axis="y" values={links} onReorder={reorderLinks} className="space-y-1.5">
          {links.map((link) => (
            <Reorder.Item key={link.id} value={link}>
              <div className="flex items-center gap-2 px-2.5 py-2.5 bg-surface-1/30 border border-border/20 rounded-lg group hover:border-border/40 transition-all hover:bg-surface-1/50">
                <GripVertical className="w-3 h-3 text-muted-foreground/30 cursor-grab shrink-0 group-hover:text-muted-foreground/60" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold truncate">{link.title}</p>
                  <p className="text-[9px] text-muted-foreground/60 truncate">{link.url}</p>
                </div>
                <span className="text-[8px] text-muted-foreground/40 tabular-nums shrink-0">{link.click_count || 0}</span>
                <button onClick={() => updateLink(link.id, { is_active: !link.is_active })} className="p-1 rounded hover:bg-surface-1 transition-colors" title={link.is_active ? "Hide" : "Show"}>
                  {link.is_active ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-muted-foreground/40" />}
                </button>
                <button onClick={() => removeLink(link.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors" title="Delete">
                  <Trash2 className="w-3 h-3 text-muted-foreground/40 hover:text-destructive" />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="text-center py-8">
          <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}20` }}>
            <Link2 className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <p className="text-[11px] font-medium mb-0.5">No links yet</p>
          <p className="text-[9px] text-muted-foreground">Add your first link to get started</p>
        </div>
      )}

      {adding ? (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
          <div className="space-y-2 p-3 border border-border/30 rounded-lg bg-surface-1/20">
            <div className="flex gap-1">
              {[
                { type: "link" as const, icon: <Link2 className="w-2.5 h-2.5" />, label: "Link" },
                { type: "embed" as const, icon: <Video className="w-2.5 h-2.5" />, label: "Embed" },
              ].map(t => (
                <button key={t.type} onClick={() => setNewType(t.type)} className={`flex-1 py-1.5 text-[9px] rounded-md flex items-center justify-center gap-1 transition-colors ${newType === t.type ? "bg-foreground/10 text-foreground font-medium" : "text-muted-foreground"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <input
              placeholder="Title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full h-8 px-3 text-[11px] bg-background border border-border/30 rounded-lg focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
              autoFocus
            />
            <input
              placeholder={newType === "embed" ? "YouTube / TikTok URL" : "https://..."}
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              className="w-full h-8 px-3 text-[11px] bg-background border border-border/30 rounded-lg focus:outline-none focus:border-border/60 text-foreground placeholder:text-muted-foreground/40"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-1.5">
              <button onClick={handleAdd} className="flex-1 h-8 text-[10px] font-semibold rounded-lg hover:opacity-90 transition-opacity text-background" style={{ backgroundColor: accentColor }}>
                Add Link
              </button>
              <button onClick={() => { setAdding(false); setNewTitle(""); setNewUrl(""); }} className="h-8 px-4 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-dashed border-border/30 rounded-lg hover:border-border/60 transition-all hover:bg-surface-1/30">
          <Plus className="w-3.5 h-3.5" /> Add link
        </button>
      )}
    </div>
  );
}
