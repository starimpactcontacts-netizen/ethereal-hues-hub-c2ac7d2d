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
      style={{
        padding: "8px 14px",
        backgroundColor: "#FDE047",
        color: "#0a0a0a",
        fontWeight: 600,
        borderRadius: 18,
        border: "1.5px solid #0a0a0a",
        boxShadow: "2px 2px 0 0 #0a0a0a",
        lineHeight: 1.35,
      }}
    >
      {children}
    </span>
  );
}