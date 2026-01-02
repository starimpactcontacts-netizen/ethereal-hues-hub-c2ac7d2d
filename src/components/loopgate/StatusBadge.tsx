interface StatusBadgeProps {
  status: "live" | "pending" | "closed" | "qualified" | "eliminated";
  small?: boolean;
}

export default function StatusBadge({ status, small = false }: StatusBadgeProps) {
  const config = {
    live: {
      bg: "bg-green-600",
      text: "text-white",
      label: "LIVE",
      dot: true,
    },
    pending: {
      bg: "bg-surface-2",
      text: "text-muted-foreground",
      label: "PENDING",
      dot: false,
    },
    closed: {
      bg: "bg-surface-2",
      text: "text-muted-foreground",
      label: "CLOSED",
      dot: false,
    },
    qualified: {
      bg: "bg-gold/10",
      text: "text-gold",
      label: "QUALIFIED",
      dot: false,
    },
    eliminated: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      label: "ELIMINATED",
      dot: false,
    },
  };

  const { bg, text, label, dot } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded ${bg} ${text} ${
        small ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]"
      } font-semibold uppercase tracking-wider`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  );
}
