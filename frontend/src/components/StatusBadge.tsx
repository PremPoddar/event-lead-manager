import { STATUSES, type Status } from "@/lib/types";

const styles: Record<Status, string> = {
  new: "bg-sky-50 text-sky-700 ring-sky-200",
  contacted: "bg-violet-50 text-violet-700 ring-violet-200",
  follow_up: "bg-amber-50 text-amber-700 ring-amber-200",
  closed: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export default function StatusBadge({ status }: { status: Status }) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}>
      {label}
    </span>
  );
}
