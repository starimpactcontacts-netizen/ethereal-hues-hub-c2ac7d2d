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
  const strokeW = 2.5;

  // Integrated corner pointer based on the reference: long skinny blade, sharp point,
  // attached flush to the absolute bottom corner on the avatar side.
  const tail = (
    <svg
      aria-hidden
      width="46"
      height="30"
      viewBox="0 0 46 30"
      className="absolute pointer-events-none"
      style={{
        bottom: -27,
        [tailSide === "left" ? "left" : "right"]: -3,
      }}
    >
      <polygon
        points={
          tailSide === "left"
            ? "46,0 10,0 0,30 15,4 46,4"
            : "0,0 36,0 46,30 31,4 0,4"
        }
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinejoin="miter"
      />
      {/* Cover the body's bottom border where the tail joins, so the seam is clean */}
      <rect
        x={tailSide === "left" ? 14 : 0}
        y={-1}
        width={32}
        height={5}
        fill={fill}
      />
    </svg>
  );

  return (
    <span
      className={`relative inline-block align-top max-w-full ${className ?? ""}`}
      style={{
        marginBottom: 30,
        lineHeight: 1.25,
      }}
    >
      <span
        className="relative inline-block"
        style={{
          background: fill,
          border: `${strokeW}px solid ${stroke}`,
          padding: "8px 14px",
          color: textColor,
          fontWeight: 700,
        }}
      >
        {children}
        {tail}
      </span>
    </span>
  );
}