import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, Music2, Video, Globe, Copyright, Instagram, Mail } from "lucide-react";
import { SiTiktok, SiYoutube, SiX, SiTwitch, SiSpotify, SiSoundcloud } from "@icons-pack/react-simple-icons";
import { supabase } from "@/integrations/supabase/client";
import type { LinkPageSettings, EditorLink } from "@/hooks/useEditorLinkPage";
import GateIcon from "@/components/loopgate/GateIcon";
import LoadingScreen from "@/components/loopgate/LoadingScreen";

const teko = { fontFamily: "Teko, sans-serif" };

interface ProfileData {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface PlatformData {
  platform: string;
  platform_url: string;
  platform_username: string;
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

function getCardStyle(cardStyle: string, accent: string) {
  switch (cardStyle) {
    case "solid":
      return { className: "border-0", style: { backgroundColor: `${accent}18` } };
    case "outline":
      return { className: "bg-transparent", style: { border: `1px solid ${accent}50` } };
    case "minimal":
      return { className: "bg-transparent rounded-2xl", style: { border: "1px solid rgba(255,255,255,0.08)" } };
    default:
      return {
        className: "backdrop-blur-xl",
        style: { backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 12px 30px rgba(0,0,0,0.28)" },
      };
  }
}

function getEmbedHtml(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" class="w-full aspect-video" frameborder="0" allowfullscreen></iframe>`;
  return null;
}

function getLinkIcon(link: EditorLink) {
  if (link.link_type === "embed") return <Video className="w-4 h-4" />;
  const url = link.url.toLowerCase();
  if (url.includes("spotify") || url.includes("soundcloud") || url.includes("music")) return <Music2 className="w-4 h-4" />;
  return <Globe className="w-4 h-4" />;
}

function getHostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

const SOCIAL_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  instagram: ({ size = 20, className }) => <Instagram size={size} className={className} />,
  tiktok: ({ size = 20, className }) => <SiTiktok size={size} className={className} />,
  youtube: ({ size = 20, className }) => <SiYoutube size={size} className={className} />,
  twitter: ({ size = 20, className }) => <SiX size={size} className={className} />,
  twitch: ({ size = 20, className }) => <SiTwitch size={size} className={className} />,
  spotify: ({ size = 20, className }) => <SiSpotify size={size} className={className} />,
  soundcloud: ({ size = 20, className }) => <SiSoundcloud size={size} className={className} />,
  email: ({ size = 20, className }) => <Mail size={size} className={className} />,
};

export default function StandaloneLinkPage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [settings, setSettings] = useState<LinkPageSettings | null>(null);
  const [links, setLinks] = useState<EditorLink[]>([]);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!username) { setNotFound(true); setLoading(false); return; }

      // Lookup profile by username or UUID
      let profileData: ProfileData | null = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);

      if (isUuid) {
        const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").eq("id", username).single();
        profileData = data as ProfileData | null;
      } else {
        const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").eq("username", username).single();
        profileData = data as ProfileData | null;
      }

      if (!profileData) { setNotFound(true); setLoading(false); return; }
      setProfile(profileData);

      // Fetch link page, links, and platforms in parallel
      const [settingsRes, linksRes, platformsRes] = await Promise.all([
        supabase.from("editor_link_pages").select("*").eq("user_id", profileData.id).eq("is_published", true).maybeSingle(),
        supabase.from("editor_links").select("*").eq("user_id", profileData.id).eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("connected_platforms").select("platform, platform_url, platform_username").eq("user_id", profileData.id),
      ]);

      if (!settingsRes.data) { setNotFound(true); setLoading(false); return; }

      setSettings(settingsRes.data as unknown as LinkPageSettings);
      setLinks((linksRes.data as unknown as EditorLink[]) || []);
      setPlatforms((platformsRes.data as PlatformData[]) || []);

      // Increment view count
      await supabase.from("editor_link_pages").update({ view_count: (settingsRes.data as any).view_count + 1 }).eq("id", (settingsRes.data as any).id);

      setLoading(false);
    }
    fetchData();
  }, [username]);

  if (loading) return <LoadingScreen />;

  if (notFound || !settings || !profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <GateIcon size={32} color="#d4af37" />
        <h1 className="text-2xl font-black mt-4" style={teko}>PAGE NOT FOUND</h1>
        <p className="text-sm text-white/40 mt-1">This link page doesn't exist or isn't published yet.</p>
        <a href="/" className="mt-6 px-6 py-2 bg-white/10 rounded-full text-sm hover:bg-white/15 transition-colors">Go Home</a>
      </div>
    );
  }

  const accent = settings.accent_color || "#d4af37";
  const textColor = settings.text_color || "#ffffff";
  const displayName = settings.page_title || (profile as any)?.display_name || profile.username;
  const avatarUrl = settings.custom_avatar_url || profile.avatar_url;
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen relative" style={{ ...getBackground(settings), color: textColor }}>
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 100%)" }} />
      {/* Noise */}
      <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="relative max-w-md mx-auto px-5 py-12 min-h-screen flex flex-col">
        {/* Avatar + Name */}
        {settings.show_avatar && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-4">
            <div
              className="w-24 h-24 rounded-full overflow-hidden mb-3"
              style={{ border: `3px solid ${accent}`, boxShadow: `0 0 30px ${accent}25` }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${accent}20` }}>
                  <span className="text-4xl font-black" style={{ color: accent, ...teko }}>{profile.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wide leading-none" style={teko}>{displayName}</h1>
            <p className="text-xs mt-1" style={{ color: `${textColor}70` }}>@{profile.username}</p>
          </motion.div>
        )}

        {/* Bio */}
        {settings.bio && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center text-sm mb-5 max-w-xs mx-auto leading-relaxed" style={{ color: `${textColor}bb` }}>
            {settings.bio}
          </motion.p>
        )}

        {/* Social Icons */}
        {settings.show_socials && platforms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex justify-center gap-3 mb-6">
            {platforms.map((p) => {
              const IconComponent = SOCIAL_ICONS[p.platform.toLowerCase()];
              return (
                <a
                  key={p.platform}
                  href={p.platform_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:brightness-125"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                  title={p.platform_username}
                >
                  {IconComponent ? (
                    <IconComponent size={18} className="opacity-80" />
                  ) : (
                    <span className="text-xs font-bold opacity-70">{p.platform.charAt(0).toUpperCase()}</span>
                  )}
                </a>
              );
            })}
          </motion.div>
        )}

        {/* Links */}
        <div className="space-y-3 flex-1">
          {links.map((link, i) => {
            const embedHtml = link.link_type === "embed" && link.url ? getEmbedHtml(link.url) : null;
            const card = getCardStyle(settings.card_style, accent);

            return (
              <motion.div key={link.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
                {embedHtml ? (
                  <div className={`overflow-hidden rounded-2xl ${card.className}`} style={card.style}>
                    <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold">{link.title}</p>
                    </div>
                  </div>
                ) : (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group block w-full rounded-2xl px-4 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${card.className}`}
                    style={card.style}
                  >
                    <div className="flex items-center gap-3">
                      {link.thumbnail_url ? (
                        <img src={link.thumbnail_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)" }}>
                          <span style={{ color: `${textColor}80` }}>{getLinkIcon(link)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold truncate" style={{ color: `${textColor}f0` }}>{link.title}</p>
                        {link.description && <p className="text-xs truncate mt-0.5" style={{ color: `${textColor}60` }}>{link.description}</p>}
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-60 transition-opacity shrink-0" />
                    </div>
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        {links.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: `${textColor}40` }}>No links yet</p>
          </div>
        )}

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-auto pt-10 flex flex-col items-center gap-2">
          <a href="/" className="flex items-center gap-1.5 opacity-30 hover:opacity-55 transition-opacity">
            <GateIcon size={12} color={accent} />
            <span className="text-[9px] font-semibold tracking-[0.18em] uppercase">Loopgate</span>
          </a>
          <div className="flex items-center gap-1 opacity-15">
            <Copyright className="w-2.5 h-2.5" />
            <span className="text-[8px]">@{profile.username} {year}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
