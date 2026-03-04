"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: "⬛" },
  { href: "/approval-queue", label: "Approval Queue", icon: "✅" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/tasks", label: "Tasks", icon: "📋" },
  { href: "/linkedin", label: "LinkedIn", icon: "🔗" },
  { href: "/automations", label: "Automations", icon: "⚡" },
  { href: "/docs-memory", label: "Docs & Memory", icon: "📚" },
  { href: "/tools", label: "Tools", icon: "🔧" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 bg-[#0b0f19] border-r border-slate-800 min-h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🦎</span>
          <div>
            <div className="text-sm font-semibold text-slate-100 leading-tight">Mission Control</div>
            <div className="text-xs text-slate-500">Ryan's HQ</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-slate-100"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500">Lester online</span>
        </div>
      </div>
    </aside>
  );
}
