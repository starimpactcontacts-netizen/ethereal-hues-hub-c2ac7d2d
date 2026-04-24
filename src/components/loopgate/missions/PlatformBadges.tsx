import { Music2, Instagram, Youtube, Twitter, Globe } from 'lucide-react';

export type MissionPlatform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'other';

const META: Record<MissionPlatform, { label: string; Icon: any; bg: string; fg: string }> = {
  tiktok:    { label: 'TikTok',    Icon: Music2,    bg: 'rgba(255,255,255,0.10)', fg: '#FFFFFF' },
  instagram: { label: 'Instagram', Icon: Instagram, bg: 'rgba(225,48,108,0.18)',  fg: '#E1306C' },
  youtube:   { label: 'YouTube',   Icon: Youtube,   bg: 'rgba(255,0,0,0.18)',     fg: '#FF3B30' },
  twitter:   { label: 'X',         Icon: Twitter,   bg: 'rgba(255,255,255,0.10)', fg: '#FFFFFF' },
  other:     { label: 'Other',     Icon: Globe,     bg: 'rgba(255,255,255,0.10)', fg: '#FFFFFF' },
};

export const ALL_MISSION_PLATFORMS: MissionPlatform[] = ['tiktok', 'instagram', 'youtube'];

interface Props {
  platforms: string[] | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function PlatformBadges({ platforms, size = 'sm', showLabel = false, className = '' }: Props) {
  const list = (platforms && platforms.length > 0 ? platforms : ALL_MISSION_PLATFORMS) as MissionPlatform[];
  const px = size === 'lg' ? 'h-7 px-2.5 text-[12px] gap-1.5' : size === 'md' ? 'h-6 px-2 text-[11px] gap-1' : 'h-[18px] px-1.5 text-[10px] gap-1';
  const ic = size === 'lg' ? 14 : size === 'md' ? 12 : 10;
  return (
    <div className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {list.map((p) => {
        const m = META[p] || META.other;
        const Icon = m.Icon;
        return (
          <span
            key={p}
            className={`inline-flex items-center rounded-full font-semibold tracking-tight ${px}`}
            style={{ background: m.bg, color: m.fg, border: '0.5px solid rgba(255,255,255,0.10)' }}
            title={m.label}
          >
            <Icon size={ic} strokeWidth={2.5} />
            {showLabel && <span>{m.label}</span>}
          </span>
        );
      })}
    </div>
  );
}
