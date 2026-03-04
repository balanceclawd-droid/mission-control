import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

export function Card({ children, className, padding = "md", onClick }: CardProps) {
  const padMap = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-[#0f1623] border border-slate-800 rounded-lg",
        padMap[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
