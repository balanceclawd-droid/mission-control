"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: "⬛" },
  { href: "/approval-queue", label: "Queue", icon: "✅" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/tasks", label: "Tasks", icon: "📋" },
  { href: "/automations", label: "Autos", icon: "⚡" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0b0f19]/95 backdrop-blur border-t border-slate-800 z-20 flex">
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors",
              isActive ? "text-slate-100" : "text-slate-500"
            )}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
