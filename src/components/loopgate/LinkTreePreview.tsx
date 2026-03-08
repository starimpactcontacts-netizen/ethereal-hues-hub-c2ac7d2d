import { motion } from "framer-motion";
import { ExternalLink, Play, Copyright, Music, Video, Globe } from "lucide-react";
import type { LinkPageSettings, EditorLink } from "@/hooks/useEditorLinkPage";
import GateIcon from "./GateIcon";

const teko = { fontFamily: "Teko, sans-serif" };

interface LinkTreePreviewProps {
  settings: LinkPageSettings;
  links: EditorLink[];
  profile: any;
  isPublic?: boolean;
  platforms?: { platform: string; platform_url: string; platform_username: string }[];
  stats?: { classLetter: string; indexScore: number; rank: number | string };
}

function getBackground(settings: LinkPageSettings) {
  if (settings.bg_type === "gradient" && settings.bg_gradient_from && settings.bg_gradient_to) {
    return { background: `linear-gradient(180deg, ${settings.bg_gradient_from} 0%, ${settings.bg_gradient_to} 100%)` };
  }
  if (settings.bg_type === "image" && settings.bg_image_url) {
    return { backgroundImage: `url(${settings.bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  return { backgroundColor: settings.bg_color || "#0a0a0a" };
}

function getLinkIcon(link: EditorLink) {
  if (link.link_type === "embed") return <Video className="w-3.5 h-3.5" />;
  const url = link.url.toLowerCase();
  if (url.includes("spotify") || url.includes("soundcloud") || url.includes("music")) return <Music className="w-3.5 h-3.5" />;
  return <Globe className="w-3.5 h-3.5" />;
}

function getEmbedHtml(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" class="w-full aspect-video" frameborder="0" allowfullscreen></iframe>`;
  return null;
}

function getLinkStyle(cardStyle: string, accent: string) {
  switch (cardStyle) {
    case "solid":
      return {
        className: "border-0",
        style: { backgroundColor: `${accent}15` },
      };
    case "outline":
      return {
        className: "bg-transparent",
        style: { border: `1.5px solid ${accent}40` },
      };
    case "minimal":
      return {
        className: "bg-transparent rounded-none border-0",
        style: { borderBottom: `1px solid ${accent}15` },
      };
    default:
      return {
        className: "backdrop-blur-md",
        style: { backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" },
      };
  }
}

export default function LinkTreePreview({ settings, links, profile, isPublic, platforms, stats }: LinkTreePreviewProps) {
  const accent = settings.accent_color || "#d4af37";
  const textColor = settings.text_color || "#ffffff";
  const username = profile?.username || "editor";
  const displayName = profile?.display_name || profile?.username || "Editor";
  const avatarUrl = settings.custom_avatar_url || profile?.avatar_url;
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-xl" style={{ ...getBackground(settings), color: textColor }}>
      {/* Ambient glow from accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: accent }} />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative max-w-md mx-auto px-5 py-10">
        {/* Identity */}
        {settings.show_avatar && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center mb-6">
            {/* Avatar with glow ring */}
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full blur-lg opacity-30" style={{ backgroundColor: accent, transform: "scale(1.2)" }} />
              <div className="relative w-[88px] h-[88px] rounded-full overflow-hidden" style={{ border: `2.5px solid ${accent}`, boxShadow: `0 0 30px ${accent}22, inset 0 0 20px ${accent}11` }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
                    <span className="text-3xl font-black" style={{ color: accent, ...teko }}>{username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-black uppercase tracking-wider leading-none" style={teko}>
              {settings.page_title || displayName}
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: `${textColor}60` }}>@{username}</p>
          </motion.div>
        )}

        {/* Bio */}
        {settings.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-center text-[13px] mb-6 max-w-xs mx-auto leading-relaxed" style={{ color: `${textColor}aa` }}>
            {settings.bio}
          </motion.p>
        )}

        {/* Stats row */}
        {settings.show_stats && stats && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center justify-center gap-5 mb-7 py-3 rounded-xl backdrop-blur-sm" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { value: stats.classLetter, label: "Class", colored: true },
              { value: stats.indexScore.toFixed(1), label: "Index" },
              { value: `#${stats.rank}`, label: "Rank" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-5">
                {i > 0 && <div className="w-px h-6" style={{ backgroundColor: `${textColor}15` }} />}
                <div className="text-center">
                  <p className="text-xl font-black leading-none" style={{ ...teko, color: s.colored ? accent : textColor }}>{s.value}</p>
                  <p className="text-[7px] uppercase tracking-[0.15em] mt-0.5" style={{ color: `${textColor}50` }}>{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Social platforms */}
        {settings.show_socials && platforms && platforms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="flex justify-center gap-2.5 mb-7">
            {platforms.map((p) => (
              <a key={p.platform} href={p.platform_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg" style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}25`, boxShadow: `0 2px 8px ${accent}08` }}>
                <span className="text-[10px] font-bold" style={{ color: `${textColor}90` }}>{p.platform.charAt(0).toUpperCase()}</span>
              </a>
            ))}
          </motion.div>
        )}

        {/* Links */}
        <div className="space-y-2.5">
          {links.map((link, i) => {
            const embedHtml = link.link_type === "embed" && link.url ? getEmbedHtml(link.url) : null;
            const linkStyle = getLinkStyle(settings.card_style, accent);

            return (
              <motion.div key={link.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}>
                {embedHtml ? (
                  <div className={`overflow-hidden rounded-xl ${linkStyle.className}`} style={linkStyle.style}>
                    <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
                    <div className="px-4 py-2.5">
                      <p className="text-[12px] font-semibold">{link.title}</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group block w-full px-4 py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${linkStyle.className}`}
                    style={{ ...linkStyle.style }}
                    onClick={(e) => { if (!isPublic) e.preventDefault(); }}
                  >
                    <div className="flex items-center gap-3">
                      {link.thumbnail_url ? (
                        <img src={link.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
                          <span style={{ color: `${accent}90` }}>{getLinkIcon(link)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{link.title}</p>
                        {link.description && <p className="text-[10px] mt-0.5 truncate" style={{ color: `${textColor}55` }}>{link.description}</p>}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 opacity-20 group-hover:opacity-50 transition-opacity shrink-0" />
                    </div>
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Empty state for public view */}
        {links.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8" style={{ color: `${textColor}30` }}>
            <p className="text-sm">No links yet</p>
          </motion.div>
        )}

        {/* Footer branding */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-12 flex flex-col items-center gap-2.5">
          <a href="/" className="flex items-center gap-1.5 opacity-25 hover:opacity-40 transition-opacity group">
            <GateIcon size={11} color={accent} />
            <span className="text-[8px] font-semibold tracking-[0.2em] uppercase" style={{ color: textColor }}>Powered by Loopgate</span>
          </a>
          <div className="flex items-center gap-1 opacity-15">
            <Copyright className="w-2.5 h-2.5" />
            <span className="text-[8px]">@{username} {year}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
