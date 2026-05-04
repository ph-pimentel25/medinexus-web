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
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}


