type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  Alive: "border-status-alive/40 bg-status-alive/15 text-status-alive",
  Dead: "border-signal/40 bg-signal/15 text-signal",
  unknown: "border-muted-ink/40 bg-muted/50 text-muted-ink",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles[status] ?? statusStyles.unknown}`}>
      {status}
    </span>
  );
}
