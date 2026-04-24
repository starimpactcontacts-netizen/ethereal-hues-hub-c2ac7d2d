import { SiTiktok, SiInstagram, SiYoutube, SiX } from '@icons-pack/react-simple-icons';
import { Globe } from 'lucide-react';

export type MissionPlatform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'other';

// iOS-style solid brand chips. No gradients, no washed transparencies.
const META: Record<MissionPlatform, { label: string; Icon: any; bg: string; fg: string; ring: string }> = {
  tiktok:    { label: 'TikTok',    Icon: SiTiktok,    bg: '#000000', fg: '#FFFFFF', ring: 'rgba(255,255,255,0.18)' },
  instagram: { label: 'Instagram', Icon: SiInstagram, bg: '#E1306C', fg: '#FFFFFF', ring: 'rgba(255,255,255,0.20)' },
  youtube:   { label: 'YouTube',   Icon: SiYoutube,   bg: '#FF0000', fg: '#FFFFFF', ring: 'rgba(255,255,255,0.20)' },
  twitter:   { label: 'X',         Icon: SiX,         bg: '#000000', fg: '#FFFFFF', ring: 'rgba(255,255,255,0.18)' },
  other:     { label: 'Other',     Icon: Globe,       bg: '#1C1C1E', fg: '#FFFFFF', ring: 'rgba(255,255,255,0.14)' },
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
  const dim = size === 'lg' ? 'h-7 w-7' : size === 'md' ? 'h-6 w-6' : 'h-5 w-5';
  const padLabel = size === 'lg' ? 'h-7 pl-1.5 pr-2.5 text-[12px] gap-1.5' : size === 'md' ? 'h-6 pl-1 pr-2 text-[11px] gap-1' : 'h-5 pl-1 pr-1.5 text-[10px] gap-1';
  const ic = size === 'lg' ? 14 : size === 'md' ? 12 : 11;
  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {list.map((p) => {
        const m = META[p] || META.other;
        const Icon = m.Icon;
        if (!showLabel) {
          return (
            <span
              key={p}
              className={`inline-flex items-center justify-center rounded-full ${dim}`}
              style={{ background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 0.5px ${m.ring}` }}
              title={m.label}
              aria-label={m.label}
            >
              <Icon size={ic} />
            </span>
          );
        }
        return (
          <span
            key={p}
            className={`inline-flex items-center rounded-full font-semibold tracking-tight ${padLabel}`}
            style={{ background: m.bg, color: m.fg, boxShadow: `inset 0 0 0 0.5px ${m.ring}` }}
            title={m.label}
          >
            <span className="inline-flex items-center justify-center rounded-full" style={{ width: ic + 6, height: ic + 6 }}>
              <Icon size={ic} />
            </span>
            <span>{m.label}</span>
          </span>
        );
      })}
    </div>
  );
}
