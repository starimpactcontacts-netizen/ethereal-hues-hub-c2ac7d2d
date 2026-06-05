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

  const tail = (
    <svg
      aria-hidden
      width="54"
      height="34"
      viewBox="0 0 54 34"
      className="absolute pointer-events-none z-0"
      style={{
        bottom: -29,
        [tailSide === "left" ? "left" : "right"]: -3,
      }}
    >
      <polygon
        points={
          tailSide === "left"
            ? "54,0 13,0 0,34 17,5 54,5"
            : "0,0 41,0 54,34 37,5 0,5"
        }
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinejoin="miter"
      />
      <rect
        x={tailSide === "left" ? 16 : 0}
        y={-2}
        width={38}
        height={8}
        fill={fill}
      />
    </svg>
  );

  return (
    <span
      className={`relative inline-block align-top max-w-full ${className ?? ""}`}
      style={{
        marginBottom: 29,
        lineHeight: 1.25,
      }}
    >
      <span
        className="relative z-10 inline-block"
        style={{
          background: fill,
          border: `${strokeW}px solid ${stroke}`,
          padding: "8px 14px",
          color: textColor,
          fontWeight: 700,
        }}
      >
        {children}
        {/* Halftone comic dots clustered near edges */}
        <svg
          aria-hidden
          className="absolute inset-0 pointer-events-none z-0"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style={{ mixBlendMode: "multiply" }}
        >
          {/* top-left cluster */}
          <circle cx="5"  cy="4"  r="1.1" fill={stroke} />
          <circle cx="11" cy="3"  r="0.8" fill={stroke} />
          <circle cx="4"  cy="9"  r="0.8" fill={stroke} />
          <circle cx="14" cy="7"  r="0.6" fill={stroke} />
          <circle cx="8"  cy="13" r="0.6" fill={stroke} />
          {/* top-right cluster */}
          <circle cx="100%" cy="4"  r="1.1" fill={stroke} transform="translate(-6,0)" />
          <circle cx="100%" cy="9"  r="0.8" fill={stroke} transform="translate(-11,0)" />
          <circle cx="100%" cy="3"  r="0.6" fill={stroke} transform="translate(-15,0)" />
          <circle cx="100%" cy="12" r="0.6" fill={stroke} transform="translate(-5,0)" />
          {/* bottom-left cluster */}
          <circle cx="5"  cy="100%" r="1.0" fill={stroke} transform="translate(0,-5)" />
          <circle cx="12" cy="100%" r="0.7" fill={stroke} transform="translate(0,-4)" />
          <circle cx="6"  cy="100%" r="0.6" fill={stroke} transform="translate(0,-11)" />
          {/* bottom-right cluster */}
          <circle cx="100%" cy="100%" r="1.0" fill={stroke} transform="translate(-6,-5)" />
          <circle cx="100%" cy="100%" r="0.7" fill={stroke} transform="translate(-13,-4)" />
          <circle cx="100%" cy="100%" r="0.6" fill={stroke} transform="translate(-5,-12)" />
        </svg>
        {tail}
      </span>
    </span>
  );
}