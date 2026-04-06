import { SVGProps } from 'react';

/**
 * Loopgate brand icon — torii gate with infinity loop.
 * Matches the official logo used across the platform.
 */
export default function GateIcon(props: SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, width, height, className, ...rest } = props;
  const w = width ?? size;
  const h = height ?? size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={w}
      height={h}
      fill="currentColor"
      className={className}
      {...rest}
    >
      {/* Curved roof / kasagi */}
      <path d="M8 14C8 14 16 8 32 8C48 8 56 14 56 14L58 12C58 12 48 5 32 5C16 5 6 12 6 12L8 14Z" />
      <path d="M10 17C10 17 18 12 32 12C46 12 54 17 54 17L56 14C56 14 46 8 32 8C18 8 8 14 8 14L10 17Z" />

      {/* Nuki (horizontal crossbar) */}
      <rect x="14" y="19" width="36" height="4" rx="0.5" />

      {/* Gakuzuka (center top piece between roof and crossbar) */}
      <rect x="29" y="14" width="6" height="5" rx="0.5" />

      {/* Two vertical pillars (hashira) */}
      <rect x="16" y="23" width="5" height="22" rx="0.5" />
      <rect x="43" y="23" width="5" height="22" rx="0.5" />

      {/* Infinity loop woven through pillars */}
      <path
        d="M18.5 48C14 48 10 44.5 10 40.5C10 36.5 14 33 18.5 33C23 33 26 36 32 40.5C38 36 41 33 45.5 33C50 33 54 36.5 54 40.5C54 44.5 50 48 45.5 48C41 48 38 45 32 40.5C26 45 23 48 18.5 48Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
