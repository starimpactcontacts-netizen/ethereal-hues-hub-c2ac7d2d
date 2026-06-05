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

  // Angular comic speech bubble with a tail dropping from bottom-right.
  // viewBox is stretched to fit the text via preserveAspectRatio="none";
  // non-scaling stroke keeps the outline crisp regardless of bubble size.
  // Tail drops from bottom edge, side controlled by tailSide.
  const points =
    tailSide === "left"
      ? "1,1 99,1 99,72 30,72 1,99"
      : "1,1 99,1 99,99 70,72 1,72";

  return (
    <span
      className={`relative inline-block align-top max-w-full ${className ?? ""}`}
      style={{
        padding: "10px 16px 22px 16px",
        filter: "drop-shadow(2px 3px 0 #0b1437)",
        lineHeight: 1.25,
      }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points={points}
          fill={fill}
          stroke="#0b1437"
          strokeWidth="3"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="relative z-[1] block"
        style={{ color: textColor, fontWeight: 700 }}
      >
        {children}
      </span>
    </span>
  );
}