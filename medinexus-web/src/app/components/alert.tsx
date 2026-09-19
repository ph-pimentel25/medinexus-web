import { CircleCheck, CircleAlert, Info } from "lucide-react";
type AlertProps = { variant?: "success" | "error" | "info"; children: React.ReactNode };
export default function Alert({ variant = "info", children }: AlertProps) {
  const styles = { success: "border-mn-sage-light bg-mn-sage-light/40 text-mn-teal", error: "border-red-200 bg-red-50 text-red-800", info: "border-mn-teal-light bg-mn-teal-light/30 text-mn-teal" };
  const Icon = variant === "success" ? CircleCheck : variant === "error" ? CircleAlert : Info;
  return <div role={variant === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${styles[variant]}`}><Icon size={18} className="mt-0.5 shrink-0"/><div>{children}</div></div>;
}
