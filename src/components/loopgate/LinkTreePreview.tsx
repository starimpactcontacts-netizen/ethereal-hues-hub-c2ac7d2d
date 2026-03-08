import { motion } from "framer-motion";
import { ExternalLink, Copyright, Music2, Video, Globe } from "lucide-react";
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

function getEmbedHtml(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" class="w-full aspect-video" frameborder="0" allowfullscreen></iframe>`;
  return null;
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "external link";
  }
}

function getLinkIcon(link: EditorLink) {
  if (link.link_type === "embed") return <Video className="w-4 h-4" />;
  const url = link.url.toLowerCase();
  if (url.includes("spotify") || url.includes("soundcloud") || url.includes("music")) return <Music2 className="w-4 h-4" />;
  return <Globe className="w-4 h-4" />;
}

function getCardStyle(cardStyle: string, accent: string) {
  switch (cardStyle) {
    case "solid":
      return {
        className: "border-0",
        style: { backgroundColor: `${accent}18` },
      };
    case "outline":
      return {
        className: "bg-transparent",
        style: { border: `1px solid ${accent}50` },
      };
    case "minimal":
      return {
        className: "bg-transparent rounded-xl",
        style: { border: "1px solid rgba(255,255,255,0.08)" },
      };
    default:
      return {
        className: "backdrop-blur-xl",
        style: {
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
        },
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
    <div className="relative min-h-[500px] overflow-hidden rounded-2xl" style={{ ...getBackground(settings), color: textColor }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }} />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative max-w-md mx-auto px-5 py-9">
        {settings.show_avatar && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-5">
            <div className="w-[84px] h-[84px] rounded-full overflow-hidden mb-3" style={{ border: `2px solid ${accent}`, boxShadow: `0 0 24px ${accent}22` }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                  <span className="text-3xl font-black" style={{ color: accent, ...teko }}>{username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <h1 className="text-[28px] font-black uppercase tracking-wide leading-none" style={teko}>{settings.page_title || displayName}</h1>
            <p className="text-[11px] mt-1" style={{ color: `${textColor}75` }}>@{username}</p>
          </motion.div>
        )}

        {settings.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center text-[13px] mb-6 max-w-xs mx-auto leading-relaxed" style={{ color: `${textColor}bb` }}>
            {settings.bio}
          </motion.p>
        )}

        {settings.show_stats && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-center justify-center gap-5 mb-6 py-3 rounded-2xl backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}>
            {[
              { value: stats.classLetter, label: "Class" },
              { value: stats.indexScore.toFixed(1), label: "Index" },
              { value: `#${stats.rank}`, label: "Rank" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-5">
                {i > 0 && <div className="w-px h-6" style={{ backgroundColor: `${textColor}20` }} />}
                <div className="text-center">
                  <p className="text-xl font-black leading-none" style={{ ...teko, color: s.label === "Class" ? accent : textColor }}>{s.value}</p>
                  <p className="text-[7px] uppercase tracking-[0.16em] mt-0.5" style={{ color: `${textColor}60` }}>{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {settings.show_socials && platforms && platforms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-center gap-2 mb-6">
            {platforms.map((p) => (
              <a
                key={p.platform}
                href={p.platform_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                <span className="text-[10px] font-semibold" style={{ color: `${textColor}90` }}>{p.platform.charAt(0).toUpperCase()}</span>
              </a>
            ))}
          </motion.div>
        )}

        <div className="space-y-2.5">
          {links.map((link, i) => {
            const embedHtml = link.link_type === "embed" && link.url ? getEmbedHtml(link.url) : null;
            const card = getCardStyle(settings.card_style, accent);

            return (
              <motion.div key={link.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                {embedHtml ? (
                  <div className={`overflow-hidden rounded-2xl ${card.className}`} style={card.style}>
                    <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
                    <div className="px-4 py-3">
                      <p className="text-[13px] font-semibold">{link.title}</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group block w-full rounded-2xl px-4 py-3.5 transition-all duration-200 hover:scale-[1.015] ${card.className}`}
                    style={card.style}
                    onClick={(e) => {
                      if (!isPublic) e.preventDefault();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {link.thumbnail_url ? (
                        <img src={link.thumbnail_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}>
                          <span style={{ color: `${textColor}85` }}>{getLinkIcon(link)}</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold truncate" style={{ color: `${textColor}f0` }}>{link.title}</p>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: `${textColor}7d` }}>{getHostname(link.url)}</p>
                        {link.description && <p className="text-[10px] truncate mt-0.5" style={{ color: `${textColor}60` }}>{link.description}</p>}
                      </div>

                      <ExternalLink className="w-3.5 h-3.5 opacity-35 group-hover:opacity-70 transition-opacity shrink-0" />
                    </div>
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        {links.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <p className="text-sm" style={{ color: `${textColor}55` }}>No links yet</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 opacity-35 hover:opacity-55 transition-opacity">
            <GateIcon size={10} color={accent} />
            <span className="text-[8px] font-semibold tracking-[0.18em] uppercase">Powered by Loopgate</span>
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
