import { ReactNode } from "react";
import { useChatBubble } from "@/lib/chatBubbleCache";

interface Props {
  userId?: string | null;
  /** Force a bubble style regardless of equipped (used for previews). */
  forceBubble?: string | null;
  children: ReactNode;
  /** Extra padding inside the burst so text doesn't touch the spikes. */
  className?: string;
}

/**
 * Wraps message text. If the user has a chat bubble cosmetic equipped,
 * renders the children inside the cosmetic frame. Otherwise renders children
 * unchanged so existing chat layouts stay pixel-identical.
 */
export default function ChatBubble({ userId, forceBubble, children, className }: Props) {
  const equipped = useChatBubble(userId);
  const bubble = (forceBubble ?? equipped)?.toLowerCase() || null;

  if (bubble !== "comic") return <>{children}</>;

  return (
    <span
      className={`relative inline-block align-top max-w-full ${className ?? ""}`}
      style={{ padding: "14px 18px", marginTop: 2, marginBottom: 2 }}
    >
      <ComicBurstSVG />
      <span className="relative z-[1] block" style={{ color: "#0a0a0a", fontWeight: 700 }}>
        {children}
      </span>
    </span>
  );
}

/** Yellow halftone comic starburst that stretches to fit its container. */
function ComicBurstSVG() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      style={{ filter: "drop-shadow(2px 2px 0 rgba(0,0,0,0.9))" }}
    >
      <defs>
        <pattern id="halftone-comic" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.1" fill="#e11d48" />
        </pattern>
        <mask id="burst-mask">
          <polygon
            fill="white"
            points="100,2 112,12 126,4 134,18 150,12 154,28 172,26 170,42 192,42 180,56 198,66 178,72 190,90 170,86 168,98 152,88 138,98 130,84 114,96 108,80 92,98 86,82 70,96 64,80 48,94 44,78 28,86 30,70 8,72 22,58 4,46 24,40 10,24 30,28 30,12 48,18 54,4 70,14 82,2 92,16"
          />
        </mask>
      </defs>
      {/* black outline */}
      <polygon
        fill="#0a0a0a"
        points="100,0 112,10 126,2 134,16 150,10 154,26 172,24 170,40 194,40 180,54 200,64 178,70 192,90 170,86 168,100 152,88 138,100 130,84 114,98 108,80 92,100 86,82 70,98 64,80 48,96 44,78 28,86 30,70 6,72 22,58 2,44 24,38 8,22 30,26 30,10 48,16 54,2 70,12 82,0 92,14"
      />
      {/* yellow fill */}
      <polygon
        fill="#FDE047"
        points="100,4 112,14 126,6 134,20 150,14 154,30 170,28 168,42 188,42 178,56 192,66 176,72 188,88 168,84 166,96 152,86 138,96 130,82 114,94 108,78 92,96 86,80 70,94 64,78 50,92 44,76 30,84 32,70 12,72 24,58 10,46 26,40 14,26 32,28 32,14 48,20 54,8 70,16 82,6 92,18"
      />
      {/* halftone overlay (clipped to burst) */}
      <g mask="url(#burst-mask)" opacity="0.55">
        <rect x="0" y="0" width="200" height="100" fill="url(#halftone-comic)" />
        <rect x="0" y="0" width="60" height="100" fill="url(#halftone-comic)" opacity="0.9" />
        <rect x="140" y="0" width="60" height="100" fill="url(#halftone-comic)" opacity="0.9" />
      </g>
    </svg>
  );
}