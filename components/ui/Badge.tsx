import { cn } from "@/lib/utils";

type BadgeVariant =
  | "hot"
  | "warm"
  | "cold"
  | "active"
  | "degraded"
  | "inactive"
  | "running"
  | "failing"
  | "paused"
  | "idle"
  | "new"
  | "contacted"
  | "replied"
  | "meeting"
  | "proposal"
  | "closed"
  | "lost"
  | "high"
  | "medium"
  | "low"
  | "critical"
  | "needs_review"
  | "approved_pending_send"
  | "stale"
  | "blocked"
  | "overdue"
  | "infra"
  | "exchange"
  | "founders"
  | "default";

const variantStyles: Record<BadgeVariant, string> = {
  hot: "bg-red-500/15 text-red-400 border-red-500/30",
  warm: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  cold: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  running: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  degraded: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  failing: "bg-red-500/15 text-red-400 border-red-500/30",
  inactive: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  paused: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  idle: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  new: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  contacted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  replied: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  meeting: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  proposal: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  closed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  lost: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  critical: "bg-red-600/20 text-red-300 border-red-500/40",
  needs_review: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  approved_pending_send: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  stale: "bg-red-500/15 text-red-400 border-red-500/30",
  blocked: "bg-red-500/15 text-red-400 border-red-500/30",
  overdue: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  infra: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  exchange: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  founders: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  default: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
