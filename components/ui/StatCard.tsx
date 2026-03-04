import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "warn" | "neutral";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: Trend;
  sub?: string;
  className?: string;
}

const trendStyles: Record<Trend, { change: string; dot: string }> = {
  up: {
    change: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  down: {
    change: "text-red-400",
    dot: "bg-red-500",
  },
  warn: {
    change: "text-amber-400",
    dot: "bg-amber-500",
  },
  neutral: {
    change: "text-slate-400",
    dot: "bg-slate-500",
  },
};

const trendArrows: Record<Trend, string> = {
  up: "↑",
  down: "↓",
  warn: "⚠",
  neutral: "—",
};

export function StatCard({ label, value, change, trend = "neutral", sub, className }: StatCardProps) {
  const styles = trendStyles[trend];

  return (
    <div
      className={cn(
        "bg-[#0f1623] border border-slate-800 rounded-lg p-4 flex flex-col gap-1",
        className
      )}
    >
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-slate-100 leading-tight">{value}</span>
      {change && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", styles.change)}>
          <span>{trendArrows[trend]}</span>
          <span>{change}</span>
        </div>
      )}
      {sub && <span className="text-xs text-slate-600">{sub}</span>}
    </div>
  );
}
