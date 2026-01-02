interface StatusBadgeProps {
  status: "live" | "pending" | "closed" | "qualified" | "eliminated";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    live: "bg-green-600 text-white",
    pending: "bg-gold text-black",
    closed: "bg-muted text-muted-foreground",
    qualified: "bg-green-600 text-white",
    eliminated: "bg-destructive text-white",
  };

  const labels = {
    live: "LIVE",
    pending: "PENDING",
    closed: "CLOSED",
    qualified: "QUALIFIED",
    eliminated: "ELIMINATED",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${styles[status]}`}
    >
      {status === "live" && (
        <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse" />
      )}
      {labels[status]}
    </span>
  );
}
