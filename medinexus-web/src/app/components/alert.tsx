type AlertProps = {
  variant?: "success" | "error" | "info";
  children: React.ReactNode;
};

export default function Alert({
  variant = "info",
  children,
}: AlertProps) {
  const styles = {
    success: "border-green-400/20 bg-green-400/10 text-green-200",
    error: "border-red-400/20 bg-red-400/10 text-red-200",
    info: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}