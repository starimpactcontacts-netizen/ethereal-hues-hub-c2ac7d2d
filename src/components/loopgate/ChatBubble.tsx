import { ReactNode } from "react";
import { useChatBubble } from "@/lib/chatBubbleCache";

interface Props {
  userId?: string | null;
  /** Force a bubble style regardless of equipped (used for previews). */
  forceBubble?: string | null;
  children: ReactNode;
  /** Extra padding inside the burst so text doesn't touch the spikes. */
  className?: string;
  /** Team tint: tints the comic bubble fill while keeping the shape identical. */
  tone?: "red" | "blue" | "neutral";
  /** Which side the tail/nub points toward — match the avatar side. */
  tailSide?: "left" | "right";
}

/**
 * Wraps message text. If the user has a chat bubble cosmetic equipped,
 * renders the children inside the cosmetic frame. Otherwise renders children
 * unchanged so existing chat layouts stay pixel-identical.
 */
export default function ChatBubble({
  userId,
  forceBubble,
  children,
  className,
  tone = "neutral",
  tailSide = "right",
}: Props) {
  const equipped = useChatBubble(userId);
  const bubble = (forceBubble ?? equipped)?.toLowerCase() || null;

  if (bubble !== "comic") return <>{children}</>;

  const fill =
    tone === "red" ? "#ef4444" :
    tone === "blue" ? "#3b82f6" :
    "#FDE047";
  const textColor = tone === "neutral" ? "#0a0a0a" : "#ffffff";
  const stroke = "#0b1437";
  const strokeW = 3;

  const points =
    tailSide === "left"
      ? "98,7 2,0 0,58 13,58 1,99 28,58 98,58"
      : "2,7 98,0 100,58 87,58 99,99 72,58 2,58";

  return (
    <span
      className={`relative inline-block align-top max-w-full ${className ?? ""}`}
      style={{
        marginBottom: 2,
        lineHeight: 1.25,
      }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 pointer-events-none overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeW}
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="relative z-10 inline-block"
        style={{
          padding: tailSide === "left" ? "8px 15px 24px 18px" : "8px 18px 24px 15px",
          color: textColor,
          fontWeight: 700,
        }}
      >
        {children}
      </span>
    </span>
  );
}