import React from "react";
import AuraUsername from "./AuraUsername";
import { useAura, useAuraByUsername, useAuraTint } from "@/lib/auraCache";

interface Props {
  userId?: string | null;
  username: string;
  prefix?: string; // e.g. "@"
  aura?: string | null; // optional pre-known override
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a username with the user's equipped aura applied automatically.
 * Drop-in replacement for any `<span>{username}</span>` across loopgate.
 */
export default function SmartUsername({ userId, username, prefix = "", aura, className, style }: Props) {
  const cached = useAura(userId);
  const cachedByUsername = useAuraByUsername(userId ? null : username);
  const effective = aura ?? cached ?? cachedByUsername;
  const tint = useAuraTint(userId, effective ?? undefined);
  return (
    <AuraUsername
      username={`${prefix}${username}`}
      aura={effective ?? undefined}
      tint={tint ?? undefined}
      className={className}
      style={style}
    />
  );
}
