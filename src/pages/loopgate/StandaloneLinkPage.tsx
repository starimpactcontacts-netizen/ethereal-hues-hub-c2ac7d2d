import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, Music2, Video, Globe, Instagram, Mail, ChevronRight } from "lucide-react";
import { SiTiktok, SiYoutube, SiX, SiTwitch, SiSpotify, SiSoundcloud } from "@icons-pack/react-simple-icons";
import { supabase } from "@/integrations/supabase/client";
import type { LinkPageSettings, EditorLink } from "@/hooks/useEditorLinkPage";
import loopgateLogo from "@/assets/loopgate-logo.png";
import LoadingScreen from "@/components/loopgate/LoadingScreen";

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
      return {
        className: "border-0",
        style: { backgroundColor: `${accent}12` },
      };
    case "outline":
      return {
        className: "bg-transparent",
        style: { border: `1.5px solid ${accent}40` },
      };
    case "minimal":
      return {
        className: "bg-transparent",
        style: { borderBottom: "1px solid rgba(255,255,255,0.06)" },
      };
    default: // glass
      return {
        className: "backdrop-blur-2xl",
        style: {
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
        },
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

      const [settingsRes, linksRes, platformsRes] = await Promise.all([
        supabase.from("editor_link_pages").select("*").eq("user_id", profileData.id).eq("is_published", true).maybeSingle(),
        supabase.from("editor_links").select("*").eq("user_id", profileData.id).eq("is_active", true).order("sort_order", { ascending: true }),
        supabase.from("connected_platforms").select("platform, platform_url, platform_username").eq("user_id", profileData.id),
      ]);

      if (!settingsRes.data) { setNotFound(true); setLoading(false); return; }

      setSettings(settingsRes.data as unknown as LinkPageSettings);
      setLinks((linksRes.data as unknown as EditorLink[]) || []);
      setPlatforms((platformsRes.data as PlatformData[]) || []);

      await supabase.from("editor_link_pages").update({ view_count: (settingsRes.data as any).view_count + 1 }).eq("id", (settingsRes.data as any).id);
      setLoading(false);
    }
    fetchData();
  }, [username]);

  if (loading) return <LoadingScreen />;

  if (notFound || !settings || !profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <img src={loopgateLogo} alt="Loopgate" className="w-8 h-8 opacity-40" />
        <h1 className="text-2xl font-black mt-4 font-display">PAGE NOT FOUND</h1>
        <p className="text-sm text-white/40 mt-1">This link page doesn't exist or isn't published yet.</p>
        <a href="/" className="mt-6 px-6 py-2.5 bg-white/10 rounded-full text-sm hover:bg-white/15 transition-colors">Go Home</a>
      </div>
    );
  }

  const accent = settings.accent_color || "#d4af37";
  const textColor = settings.text_color || "#ffffff";
  const displayName = settings.page_title || (profile as any)?.display_name || profile.username;
  const avatarUrl = settings.custom_avatar_url || profile.avatar_url;

  return (
    <div className="min-h-screen relative" style={{ ...getBackground(settings), color: textColor }}>
      {/* Subtle vignette overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center top, transparent 40%, rgba(0,0,0,0.4) 100%)" }} />

      <div className="relative max-w-[420px] mx-auto px-5 pt-14 pb-8 min-h-screen flex flex-col">
        {/* Avatar + Name */}
        {settings.show_avatar && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center mb-5">
            <div
              className="w-[100px] h-[100px] rounded-full overflow-hidden mb-4 relative"
              style={{ border: `3px solid ${accent}`, boxShadow: `0 0 40px ${accent}20, 0 0 80px ${accent}08` }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                  <span className="text-[42px] font-black" style={{ color: accent, fontFamily: "Inter, sans-serif" }}>
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-[28px] font-black uppercase tracking-wide leading-none font-display">{displayName}</h1>
            <p className="text-[13px] mt-1.5 font-medium" style={{ color: `${textColor}55` }}>@{profile.username}</p>
          </motion.div>
        )}

        {/* Bio */}
        {settings.bio && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center text-[14px] mb-6 max-w-[320px] mx-auto leading-relaxed"
            style={{ color: `${textColor}aa` }}
          >
            {settings.bio}
          </motion.p>
        )}

        {/* Social Icons */}
        {settings.show_socials && platforms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex justify-center gap-2.5 mb-7">
            {platforms.map((p) => {
              const IconComponent = SOCIAL_ICONS[p.platform.toLowerCase()];
              return (
                <a
                  key={p.platform}
                  href={p.platform_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  title={p.platform_username}
                >
                  {IconComponent ? (
                    <IconComponent size={18} className="opacity-70" />
                  ) : (
                    <span className="text-xs font-bold opacity-60">{p.platform.charAt(0).toUpperCase()}</span>
                  )}
                </a>
              );
            })}
          </motion.div>
        )}

        {/* Links */}
        <div className="space-y-2.5 flex-1">
          {links.map((link, i) => {
            const embedHtml = link.link_type === "embed" && link.url ? getEmbedHtml(link.url) : null;
            const card = getCardStyle(settings.card_style || "glass", accent);
            const hostname = getHostname(link.url);

            return (
              <motion.div key={link.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04, duration: 0.35 }}>
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
                    className={`group block w-full rounded-2xl px-4 py-3.5 transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] ${card.className}`}
                    style={card.style}
                  >
                    <div className="flex items-center gap-3.5">
                      {link.thumbnail_url ? (
                        <img src={link.thumbnail_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                        >
                          <span style={{ color: `${textColor}60` }}>{getLinkIcon(link)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold truncate leading-tight" style={{ color: `${textColor}ee` }}>{link.title}</p>
                        <p className="text-[11px] truncate mt-0.5" style={{ color: `${textColor}40` }}>
                          {link.description || hostname}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-20 group-hover:opacity-50 transition-opacity shrink-0" />
                    </div>
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        {links.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: `${textColor}35` }}>No links yet</p>
          </div>
        )}

        {/* Loopgate Branding Footer — always visible, promotes the platform */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-auto pt-10 flex flex-col items-center gap-4"
        >
          {/* Main CTA */}
          <a
            href="/"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <img src={loopgateLogo} alt="Loopgate" className="w-4 h-4 opacity-60 group-hover:opacity-90 transition-opacity" />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-50 group-hover:opacity-80 transition-opacity">
              Create Your Own
            </span>
          </a>

          {/* Powered by line */}
          <div className="flex items-center gap-1.5 opacity-30">
            <img src={loopgateLogo} alt="" className="w-3 h-3" />
            <span className="text-[9px] font-semibold tracking-[0.15em] uppercase">Powered by Loopgate</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
