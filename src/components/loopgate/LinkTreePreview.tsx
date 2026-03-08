import { motion } from "framer-motion";
import { ExternalLink, Play, Copyright } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

function getCardClasses(style: string, accent: string) {
  switch (style) {
    case "solid":
      return "bg-white/10 border-0";
    case "outline":
      return "bg-transparent border";
    case "minimal":
      return "bg-transparent border-b border-white/10 rounded-none";
    default:
      return "bg-white/5 backdrop-blur-sm border border-white/10";
  }
}

function getEmbedHtml(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" class="w-full aspect-video" frameborder="0" allowfullscreen></iframe>`;
  
  // TikTok - just show as link with play icon
  if (url.includes("tiktok.com")) return null;
  
  return null;
}

export default function LinkTreePreview({ settings, links, profile, isPublic, platforms, stats }: LinkTreePreviewProps) {
  const accent = settings.accent_color || "#d4af37";
  const textColor = settings.text_color || "#ffffff";
  const username = profile?.username || "editor";
  const displayName = profile?.display_name || profile?.username || "Editor";
  const avatarUrl = settings.custom_avatar_url || profile?.avatar_url;
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-[500px] overflow-hidden" style={{ ...getBackground(settings), color: textColor }}>
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative max-w-md mx-auto px-4 py-8">
        {/* Identity */}
        {settings.show_avatar && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-5">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3" style={{ border: `2px solid ${accent}`, boxShadow: `0 0 20px ${accent}33` }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                  <span className="text-2xl font-bold" style={{ color: accent, fontFamily: "Teko, sans-serif" }}>
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-xl font-black uppercase tracking-wide" style={teko}>{settings.page_title || displayName}</h1>
            <p className="text-xs opacity-50">@{username}</p>
          </motion.div>
        )}

        {/* Bio */}
        {settings.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center text-xs opacity-70 mb-5 max-w-xs mx-auto leading-relaxed">
            {settings.bio}
          </motion.p>
        )}

        {/* Stats row */}
        {settings.show_stats && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-lg font-black" style={{ ...teko, color: accent }}>{stats.classLetter}</p>
              <p className="text-[8px] uppercase tracking-wider opacity-50">Class</p>
            </div>
            <div className="w-px h-6 opacity-20" style={{ backgroundColor: textColor }} />
            <div className="text-center">
              <p className="text-lg font-black" style={teko}>{stats.indexScore.toFixed(1)}</p>
              <p className="text-[8px] uppercase tracking-wider opacity-50">Index</p>
            </div>
            <div className="w-px h-6 opacity-20" style={{ backgroundColor: textColor }} />
            <div className="text-center">
              <p className="text-lg font-black" style={teko}>#{stats.rank}</p>
              <p className="text-[8px] uppercase tracking-wider opacity-50">Rank</p>
            </div>
          </motion.div>
        )}

        {/* Social platforms */}
        {settings.show_socials && platforms && platforms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-center gap-3 mb-6">
            {platforms.map((p) => (
              <a key={p.platform} href={p.platform_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ backgroundColor: `${accent}20`, border: `1px solid ${accent}40` }}>
                <span className="text-[10px] font-bold opacity-80">{p.platform.charAt(0).toUpperCase()}</span>
              </a>
            ))}
          </motion.div>
        )}

        {/* Links */}
        <div className="space-y-2">
          {links.map((link, i) => {
            const embedHtml = link.link_type === "embed" && link.url ? getEmbedHtml(link.url) : null;

            return (
              <motion.div key={link.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                {embedHtml ? (
                  <div className={`overflow-hidden rounded ${getCardClasses(settings.card_style, accent)}`}>
                    <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
                    <div className="px-3 py-2">
                      <p className="text-[11px] font-semibold">{link.title}</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full px-4 py-3 text-center transition-all duration-200 hover:scale-[1.02] ${getCardClasses(settings.card_style, accent)}`}
                    style={{ borderColor: `${accent}30` }}
                    onClick={(e) => {
                      if (!isPublic) e.preventDefault();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {link.thumbnail_url && <img src={link.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover" />}
                        <div className="text-left">
                          <p className="text-[12px] font-semibold">{link.title}</p>
                          {link.description && <p className="text-[9px] opacity-50">{link.description}</p>}
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 opacity-30" />
                    </div>
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer branding */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 opacity-30 hover:opacity-50 transition-opacity">
            <GateIcon size={10} color={accent} />
            <span className="text-[8px] font-medium tracking-wider uppercase">Powered by Loopgate</span>
          </div>
          <div className="flex items-center gap-1 opacity-20">
            <Copyright className="w-2.5 h-2.5" />
            <span className="text-[8px]">@{username} {year}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
