import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-800">{children}</tr>
    </thead>
  );
}

export function TableHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-3 py-2 first:pl-0 last:pr-0",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-800/60">{children}</tbody>;
}

export function TableRow({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      className={cn(
        "hover:bg-slate-800/20 transition-colors cursor-default",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("px-3 py-2.5 text-slate-300 first:pl-0 last:pr-0", className)}>
      {children}
    </td>
  );
}
