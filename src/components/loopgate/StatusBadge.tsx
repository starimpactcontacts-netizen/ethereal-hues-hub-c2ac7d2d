interface StatusBadgeProps {
  status: "live" | "pending" | "closed" | "qualified" | "eliminated";
  small?: boolean;
}

export default function StatusBadge({ status, small = false }: StatusBadgeProps) {
  const config = {
    live: {
      tone: "border-emerald-400/50 text-emerald-400",
      label: "LIVE",
      dot: true,
    },
    pending: {
      tone: "border-border text-muted-foreground",
      label: "PENDING",
      dot: false,
    },
    closed: {
      tone: "border-border text-muted-foreground",
      label: "CLOSED",
      dot: false,
    },
    qualified: {
      tone: "border-gold/40 text-gold",
      label: "QUALIFIED",
      dot: false,
    },
    eliminated: {
      tone: "border-destructive/40 text-destructive",
      label: "ELIMINATED",
      dot: false,
    },
  };

  const { tone, label, dot } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border bg-transparent ${tone} ${
        small ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
      } font-bold uppercase tracking-[0.08em]`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
      {label}
    </span>
  );
}
