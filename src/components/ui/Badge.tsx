const VARIANTS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  paid: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  printing: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  shipped: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500" },
  paid_print_failed: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600" },
  held: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  transferred: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  onboarding: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  none: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  error: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600" },
  success: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
};

interface BadgeProps {
  variant: string;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export default function Badge({ variant, children, dot = true, className = "" }: BadgeProps) {
  const style = VARIANTS[variant] || VARIANTS.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
      )}
      {children}
    </span>
  );
}
