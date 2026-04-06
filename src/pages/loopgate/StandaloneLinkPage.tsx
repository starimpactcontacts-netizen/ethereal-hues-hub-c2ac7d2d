import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Music2, Video, Globe, Instagram, Mail, Trophy, Swords, TrendingUp } from "lucide-react";
import { SiTiktok, SiYoutube, SiX, SiTwitch, SiSpotify, SiSoundcloud } from "@icons-pack/react-simple-icons";
import { supabase } from "@/integrations/supabase/client";
import type { LinkPageSettings, EditorLink } from "@/hooks/useEditorLinkPage";
import { getRankFromScore } from "@/data/gqtConfig";
import loopgateLogo from "@/assets/loopgate-logo.png";
import LoadingScreen from "@/components/loopgate/LoadingScreen";

interface ProfileData {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  league?: string;
  global_index_score?: number;
  total_events?: number;
  total_wins?: number;
  best_gatekeeper_qoi?: number;
  level?: number;
  win_rate?: number;
}

interface PlatformData {
  platform: string;
  platform_url: string;
  platform_username: string;
}

function getBackground(settings: LinkPageSettings) {
  if (settings.bg_type === "image" && settings.bg_image_url) {
    return { backgroundImage: `url(${settings.bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  return { backgroundColor: settings.bg_color || "#000000" };
}

function getEmbedHtml(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" class="w-full aspect-video" frameborder="0" allowfullscreen></iframe>`;
  return null;
}

function getLinkIcon(link: EditorLink) {
  if (link.link_type === "embed") return <Video className="w-5 h-5" />;
  const url = link.url.toLowerCase();
  if (url.includes("spotify") || url.includes("soundcloud") || url.includes("music")) return <Music2 className="w-5 h-5" />;
  return <Globe className="w-5 h-5" />;
}

function getHostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function getClassInfo(profile: ProfileData): { letter: string; hex: string } {
  const CLASS_HEX: Record<string, string> = {
    "S++": "#d4af37", "S+": "#d4af37", "S": "#f59e0b",
    "A": "#34d399", "B": "#60a5fa", "C": "#cbd5e1",
    "D": "#fb923c", "F": "#ef4444",
  };
  if (profile.best_gatekeeper_qoi && profile.best_gatekeeper_qoi > 0) {
    const r = getRankFromScore(profile.best_gatekeeper_qoi);
    return { letter: r.rank, hex: CLASS_HEX[r.rank] || "#ef4444" };
  }
  if ((profile.level || 1) >= 2) return { letter: "D", hex: "#fb923c" };
  return { letter: "F", hex: "#ef4444" };
}

const SOCIAL_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  instagram: ({ size = 22, className }) => <Instagram size={size} className={className} />,
  tiktok: ({ size = 22, className }) => <SiTiktok size={size} className={className} />,
  youtube: ({ size = 22, className }) => <SiYoutube size={size} className={className} />,
  twitter: ({ size = 22, className }) => <SiX size={size} className={className} />,
  twitch: ({ size = 22, className }) => <SiTwitch size={size} className={className} />,
  spotify: ({ size = 22, className }) => <SiSpotify size={size} className={className} />,
  soundcloud: ({ size = 22, className }) => <SiSoundcloud size={size} className={className} />,
  email: ({ size = 22, className }) => <Mail size={size} className={className} />,
};

const LEAGUE_LABELS: Record<string, string> = {
  bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum",
  diamond: "Diamond", master: "Master", grandmaster: "Grandmaster",
  open: "Open", pro: "Pro", elite: "Elite",
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

      const profileFields = "id, username, display_name, avatar_url, league, global_index_score, total_events, total_wins, best_gatekeeper_qoi, level, win_rate";
      let profileData: ProfileData | null = null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);

      if (isUuid) {
        const { data } = await supabase.from("profiles").select(profileFields).eq("id", username).single();
        profileData = data as ProfileData | null;
      } else {
        const { data } = await supabase.from("profiles").select(profileFields).eq("username", username).single();
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

  const textColor = settings.text_color || "#ffffff";
  const displayName = settings.page_title || profile.display_name || profile.username;
  const avatarUrl = settings.custom_avatar_url || profile.avatar_url;
  const classInfo = getClassInfo(profile);
  const showStats = settings.show_stats !== false;

  // Calculate editor star rating (1-5) based on overall stats
  const calcStarRating = (): number => {
    let score = 0;
    const idx = profile.global_index_score || 0;
    const battles = profile.total_events || 0;
    const wins = profile.total_wins || 0;
    const winRate = profile.win_rate || 0;
    const level = profile.level || 1;
    // Index contribution (0-1.5)
    if (idx >= 200) score += 1.5;
    else if (idx >= 100) score += 1;
    else if (idx >= 30) score += 0.5;
    // Battle experience (0-1)
    if (battles >= 20) score += 1;
    else if (battles >= 5) score += 0.5;
    // Win rate (0-1)
    if (winRate >= 60) score += 1;
    else if (winRate >= 40) score += 0.5;
    // Level (0-1)
    if (level >= 5) score += 1;
    else if (level >= 3) score += 0.5;
    // Class bonus (0-0.5)
    if (["S++","S+","S","A"].includes(classInfo.letter)) score += 0.5;
    return Math.max(1, Math.min(5, Math.round(score)));
  };
  const starRating = calcStarRating();

  return (
    <div className="min-h-screen" style={{ ...getBackground(settings), color: textColor }}>
      <div className="max-w-[440px] mx-auto px-5 pt-16 pb-10 min-h-screen flex flex-col">

        {/* Profile Header */}
        {settings.show_avatar && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-white/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <span className="text-[36px] font-black text-white/60">{profile.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold leading-tight">{displayName}</h1>

            {/* Bio */}
            {settings.bio && (
              <p className="text-sm text-white/60 text-center mt-2 max-w-[300px] leading-relaxed">{settings.bio}</p>
            )}
          </motion.div>
        )}

        {/* Social Icons Row */}
        {settings.show_socials && platforms.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex justify-center gap-4 mb-6">
            {platforms.map((p) => {
              const IconComponent = SOCIAL_ICONS[p.platform.toLowerCase()];
              return (
                <a key={p.platform} href={p.platform_url} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors" title={p.platform_username}>
                  {IconComponent ? <IconComponent size={22} /> : <span className="text-sm font-bold">{p.platform.charAt(0).toUpperCase()}</span>}
                </a>
              );
            })}
          </motion.div>
        )}

        {/* Editor Stats — Class, Rank, Stars */}
        {showStats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="mb-6">
            <div className="flex items-center justify-center gap-6">
              {/* Class */}
              <div className="flex flex-col items-center">
                <p className="text-lg font-black text-white/80">{classInfo.letter}</p>
                <span className="text-[9px] text-white/30 font-medium uppercase tracking-wide">Class</span>
              </div>

              <div className="w-px h-7 bg-white/10" />

              {/* Global Rank */}
              <div className="flex flex-col items-center">
                <p className="text-lg font-black tabular-nums text-white/80">#{profile.global_index_score || 0}</p>
                <span className="text-[9px] text-white/30 font-medium uppercase tracking-wide">Rank</span>
              </div>

              <div className="w-px h-7 bg-white/10" />

              {/* Star Rating */}
              <div className="flex flex-col items-center">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className={`w-3.5 h-3.5 ${s <= starRating ? 'text-white/80' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[9px] text-white/30 font-medium uppercase tracking-wide mt-0.5">Trust</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Links */}
        <div className="space-y-3 flex-1">
          {links.map((link, i) => {
            const embedHtml = link.link_type === "embed" && link.url ? getEmbedHtml(link.url) : null;
            const hostname = getHostname(link.url);

            return (
              <motion.div key={link.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}>
                {embedHtml ? (
                  <div className="overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.08]">
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
                    className="group block w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-4 py-4 transition-all duration-150 hover:bg-white/[0.07] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      {link.thumbnail_url ? (
                        <img src={link.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-white/[0.04]">
                          <span className="text-white/40">{getLinkIcon(link)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold truncate">{link.title}</p>
                        {(link.description || hostname) && (
                          <p className="text-xs text-white/35 truncate mt-0.5">{link.description || hostname}</p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        {links.length === 0 && (
          <div className="text-center py-20 flex-1 flex items-center justify-center">
            <p className="text-sm text-white/25">No links yet</p>
          </div>
        )}

        {/* Footer — Powered by Loopgate */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-auto pt-12 flex flex-col items-center gap-5">
          <a
            href="/"
            className="flex items-center gap-2.5 text-white/30 hover:text-white/50 transition-colors"
          >
            <img src={loopgateLogo} alt="Loopgate" className="w-4 h-4 opacity-50" />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">Powered by Loopgate</span>
          </a>
        </motion.div>
      </div>
    </div>
  );
}
