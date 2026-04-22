type AlertProps = {
  variant?: "success" | "error" | "info";
  children: React.ReactNode;
};

export default function Alert({
  variant = "info",
  children,
}: AlertProps) {
  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}