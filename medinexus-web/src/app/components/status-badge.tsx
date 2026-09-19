type Status =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

type StatusBadgeProps = {
  status: Status;
};

const config = {
  pending: {
    label: "Pendente",
    className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  rejected: {
    label: "Recusada",
    className: "bg-red-50 text-red-700 ring-1 ring-red-200",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  },
  completed: {
    label: "Concluída",
    className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const item = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"/>{item.label}
    </span>
  );
}


