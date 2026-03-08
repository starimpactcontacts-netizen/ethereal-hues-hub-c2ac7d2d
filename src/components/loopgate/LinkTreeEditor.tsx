import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, Trash2, GripVertical, ExternalLink, Eye, EyeOff, Link2, Video, Globe, Palette, Type, ToggleLeft, ChevronDown, ChevronUp, Image } from "lucide-react";
import { useEditorLinkPage, type EditorLink } from "@/hooks/useEditorLinkPage";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import LinkTreePreview from "./LinkTreePreview";

const teko = { fontFamily: "Teko, sans-serif" };

const BG_PRESETS = [
  { label: "Midnight", bg_type: "solid", bg_color: "#0a0a0a" },
  { label: "Dark Blue", bg_type: "solid", bg_color: "#0c1220" },
  { label: "Crimson", bg_type: "gradient", bg_gradient_from: "#1a0000", bg_gradient_to: "#0a0a0a" },
  { label: "Gold Fade", bg_type: "gradient", bg_gradient_from: "#1a1400", bg_gradient_to: "#0a0a0a" },
  { label: "Cyber", bg_type: "gradient", bg_gradient_from: "#001a1a", bg_gradient_to: "#0a0a0a" },
  { label: "Purple Haze", bg_type: "gradient", bg_gradient_from: "#150020", bg_gradient_to: "#0a0a0a" },
];

const ACCENT_COLORS = ["#d4af37", "#ef4444", "#3b82f6", "#10b981", "#a855f7", "#f97316", "#ec4899", "#06b6d4"];

const CARD_STYLES = [
  { value: "default", label: "Glass" },
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "minimal", label: "Minimal" },
];

export default function LinkTreeEditor() {
  const { profile } = useAuth();
  const { settings, links, loading, saveSettings, addLink, updateLink, removeLink, reorderLinks } = useEditorLinkPage(profile?.id);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<"link" | "embed">("link");
  const [expandedSection, setExpandedSection] = useState<string | null>("links");

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground text-sm">Loading link page...</p>
      </div>
    );
  }

  const handleAddLink = async () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    // Detect embed type
    let embedUrl = null;
    let linkType = newType;
    if (newType === "embed") {
      embedUrl = newUrl;
      linkType = "embed";
    }
    await addLink({ title: newTitle, url: newUrl, link_type: linkType, embed_url: embedUrl });
    setNewTitle("");
    setNewUrl("");
    setShowAddLink(false);
    toast.success("Link added");
  };

  const togglePublish = async () => {
    await saveSettings({ is_published: !settings.is_published });
    toast.success(settings.is_published ? "Link page unpublished" : "Link page published!");
  };

  const copyLink = () => {
    const url = `${window.location.origin}/editor/${profile?.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="border border-border bg-surface-1">
      <button onClick={() => setExpandedSection(expandedSection === id ? null : id)} className="w-full flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span>
        </div>
        {expandedSection === id ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expandedSection === id && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-black uppercase tracking-wide" style={teko}>My Link Page</h2>
          <p className="text-[10px] text-muted-foreground">Customize your shareable link page</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="text-[10px] h-7 gap-1">
            <Eye className="w-3 h-3" />
            {showPreview ? "Edit" : "Preview"}
          </Button>
          <Button
            size="sm"
            onClick={togglePublish}
            className={`text-[10px] h-7 gap-1 ${settings.is_published ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gold text-background hover:bg-gold/90"}`}
          >
            {settings.is_published ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {settings.is_published ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Published URL */}
      {settings.is_published && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30">
          <Globe className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 flex-1 truncate">loopgate.io/editor/{profile?.username || profile?.id}</span>
          <button onClick={copyLink} className="text-[10px] text-emerald-400 underline">Copy</button>
        </motion.div>
      )}

      {showPreview ? (
        <LinkTreePreview settings={settings} links={links.filter(l => l.is_active)} profile={profile} />
      ) : (
        <div className="space-y-2">
          {/* ═══ LINKS SECTION ═══ */}
          <Section id="links" title="Links" icon={Link2}>
            {links.length > 0 ? (
              <Reorder.Group axis="y" values={links} onReorder={reorderLinks} className="space-y-1.5">
                {links.map((link) => (
                  <Reorder.Item key={link.id} value={link}>
                    <div className="flex items-center gap-2 px-2 py-2 bg-background border border-border group">
                      <GripVertical className="w-3 h-3 text-muted-foreground/40 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate">{link.title}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{link.url}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] text-muted-foreground/50">{link.click_count} clicks</span>
                        <button onClick={() => updateLink(link.id, { is_active: !link.is_active })} className="p-1 hover:bg-surface-1 rounded">
                          {link.is_active ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                        </button>
                        <button onClick={() => removeLink(link.id)} className="p-1 hover:bg-red-500/10 rounded">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <p className="text-[10px] text-muted-foreground text-center py-3">No links yet. Add your first link below.</p>
            )}

            {showAddLink ? (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 border border-border p-2 bg-background">
                <div className="flex gap-1">
                  <button onClick={() => setNewType("link")} className={`flex-1 py-1 text-[9px] font-semibold uppercase border ${newType === "link" ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground"}`}>
                    <Link2 className="w-3 h-3 inline mr-1" />Link
                  </button>
                  <button onClick={() => setNewType("embed")} className={`flex-1 py-1 text-[9px] font-semibold uppercase border ${newType === "embed" ? "border-purple-400 text-purple-400 bg-purple-500/10" : "border-border text-muted-foreground"}`}>
                    <Video className="w-3 h-3 inline mr-1" />Embed
                  </button>
                </div>
                <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="h-7 text-[11px]" />
                <Input placeholder={newType === "embed" ? "YouTube / TikTok URL" : "https://..."} value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="h-7 text-[11px]" />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleAddLink} className="flex-1 h-7 text-[10px] bg-gold text-background hover:bg-gold/90">Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddLink(false)} className="h-7 text-[10px]">Cancel</Button>
                </div>
              </motion.div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAddLink(true)} className="w-full h-7 text-[10px] gap-1 border-dashed">
                <Plus className="w-3 h-3" /> Add Link
              </Button>
            )}
          </Section>

          {/* ═══ APPEARANCE ═══ */}
          <Section id="appearance" title="Appearance" icon={Palette}>
            {/* Background presets */}
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Background</p>
              <div className="grid grid-cols-3 gap-1">
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => saveSettings({
                      bg_type: preset.bg_type,
                      bg_color: preset.bg_color || null,
                      bg_gradient_from: (preset as any).bg_gradient_from || null,
                      bg_gradient_to: (preset as any).bg_gradient_to || null,
                    })}
                    className="px-2 py-1.5 border border-border text-[9px] font-medium hover:border-foreground/30 transition-colors"
                    style={{
                      background: preset.bg_type === "gradient"
                        ? `linear-gradient(135deg, ${(preset as any).bg_gradient_from}, ${(preset as any).bg_gradient_to})`
                        : preset.bg_color,
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent color */}
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Accent Color</p>
              <div className="flex gap-1">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => saveSettings({ accent_color: color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${settings.accent_color === color ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Card style */}
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Card Style</p>
              <div className="grid grid-cols-4 gap-1">
                {CARD_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => saveSettings({ card_style: style.value })}
                    className={`px-2 py-1.5 text-[9px] font-medium border transition-colors ${settings.card_style === style.value ? "border-gold text-gold bg-gold/10" : "border-border text-muted-foreground"}`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ═══ CONTENT ═══ */}
          <Section id="content" title="Content" icon={Type}>
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Page Title</p>
              <Input
                placeholder="My Link Page"
                value={settings.page_title || ""}
                onChange={(e) => setSettings({ ...settings, page_title: e.target.value })}
                onBlur={() => saveSettings({ page_title: settings.page_title })}
                className="h-7 text-[11px]"
              />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
              <textarea
                placeholder="Tell the world about yourself..."
                value={settings.bio || ""}
                onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                onBlur={() => saveSettings({ bio: settings.bio })}
                className="w-full h-16 px-2 py-1.5 text-[11px] bg-background border border-border rounded resize-none focus:outline-none focus:ring-1 focus:ring-gold/50"
                maxLength={300}
              />
            </div>
          </Section>

          {/* ═══ TOGGLES ═══ */}
          <Section id="toggles" title="Display Options" icon={ToggleLeft}>
            {[
              { key: "show_avatar" as const, label: "Show Avatar" },
              { key: "show_stats" as const, label: "Show Stats (Class, Index, Rank)" },
              { key: "show_socials" as const, label: "Show Social Platforms" },
            ].map((toggle) => (
              <button
                key={toggle.key}
                onClick={() => saveSettings({ [toggle.key]: !settings[toggle.key] })}
                className="w-full flex items-center justify-between py-1.5"
              >
                <span className="text-[10px]">{toggle.label}</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${settings[toggle.key] ? "bg-emerald-500" : "bg-muted"} relative`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${settings[toggle.key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}
