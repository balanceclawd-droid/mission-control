"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { leads } from "@/lib/mock/leads";
import type { LeadTemp, LeadStatus } from "@/lib/mock/leads";

// Phase 1 extended fields — merged into leads for the command center view
const leadMeta: Record<string, {
  accountBlocked?: boolean;
  accountHandle?: string;
  awaitingApproval?: boolean;
  overdueDays?: number; // days since last contact
  segment?: "infra" | "exchange" | "founders" | "other";
}> = {
  l1: { accountHandle: "@ryan_clawd_li", awaitingApproval: false, overdueDays: 0, segment: "founders" },
  l2: { accountHandle: "@ryan_clawd_li", awaitingApproval: false, overdueDays: 1, segment: "exchange" },
  l3: { accountHandle: "@ryan_x", awaitingApproval: false, overdueDays: 2, segment: "founders" },
  l4: { accountHandle: "@ryan_clawd_li", awaitingApproval: true, overdueDays: 3, segment: "infra" },
  l5: { accountHandle: "@lester_tg", accountBlocked: false, awaitingApproval: false, overdueDays: 7, segment: "founders" },
  l6: { accountHandle: "@enreach_account_1", accountBlocked: true, awaitingApproval: true, overdueDays: 4, segment: "exchange" },
  l7: { accountHandle: "@ryan_clawd_li", awaitingApproval: true, overdueDays: 0, segment: "exchange" },
  l8: { accountHandle: "@ryan_x", awaitingApproval: false, overdueDays: 14, segment: "founders" },
  l9: { accountHandle: "@ryan_clawd_li", awaitingApproval: false, overdueDays: 1, segment: "infra" },
  l10: { accountHandle: "@enreach_account_1", accountBlocked: true, awaitingApproval: false, overdueDays: 5, segment: "infra" },
};

type ViewTab = "all" | "warm_hot" | "awaiting_approval" | "blocked_account" | "overdue";
const VIEW_TABS: Array<{ value: ViewTab; label: string }> = [
  { value: "all", label: "All Leads" },
  { value: "warm_hot", label: "Warm / Hot" },
  { value: "awaiting_approval", label: "Awaiting Approval" },
  { value: "blocked_account", label: "Blocked Account" },
  { value: "overdue", label: "Overdue (5+ days)" },
];

const tempFilters: Array<LeadTemp | "all"> = ["all", "hot", "warm", "cold"];
const statusFilters: Array<LeadStatus | "all"> = ["all", "new", "contacted", "replied", "meeting", "proposal"];

export default function LeadsPage() {
  const [view, setView] = useState<ViewTab>("all");
  const [tempFilter, setTempFilter] = useState<LeadTemp | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  const enriched = leads.map((l) => ({ ...l, ...leadMeta[l.id] }));

  const counts = useMemo(() => ({
    warm: enriched.filter((l) => l.temp === "warm").length,
    hot: enriched.filter((l) => l.temp === "hot").length,
    blocked: enriched.filter((l) => l.accountBlocked).length,
    overdue: enriched.filter((l) => (l.overdueDays ?? 0) >= 5).length,
    awaitingApproval: enriched.filter((l) => l.awaitingApproval).length,
  }), []);

  const filtered = useMemo(() => {
    let base = enriched;

    // Apply view filter
    if (view === "warm_hot") base = base.filter((l) => l.temp === "hot" || l.temp === "warm");
    else if (view === "awaiting_approval") base = base.filter((l) => l.awaitingApproval);
    else if (view === "blocked_account") base = base.filter((l) => l.accountBlocked);
    else if (view === "overdue") base = base.filter((l) => (l.overdueDays ?? 0) >= 5);

    // Apply additional filters (only in "all" view)
    if (view === "all") {
      if (tempFilter !== "all") base = base.filter((l) => l.temp === tempFilter);
      if (statusFilter !== "all") base = base.filter((l) => l.status === statusFilter);
    }

    return base;
  }, [view, tempFilter, statusFilter]);

  const canSend = (lead: typeof enriched[0]) => !lead.accountBlocked && !lead.awaitingApproval;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Leads</h1>
        <p className="text-xs text-slate-500 mt-0.5">Pipeline command center — contacts, outreach targets, and status</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatCard label="Hot" value={String(counts.hot)} trend="up" change={`${counts.hot} active`} />
        <StatCard label="Warm" value={String(counts.warm)} trend="neutral" />
        <StatCard label="Blocked Account" value={String(counts.blocked)} trend={counts.blocked > 0 ? "warn" : "neutral"} />
        <StatCard label="Overdue (5d+)" value={String(counts.overdue)} trend={counts.overdue > 0 ? "down" : "neutral"} />
        <StatCard label="Awaiting Approval" value={String(counts.awaitingApproval)} trend={counts.awaitingApproval > 0 ? "warn" : "neutral"} />
      </div>

      {/* View tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-slate-800 pb-3">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setView(tab.value)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              view === tab.value
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Additional filters — only in "all" view */}
      {view === "all" && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 self-center mr-1">Temp:</span>
            {tempFilters.map((f) => (
              <button
                key={f}
                onClick={() => setTempFilter(f)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  tempFilter === f
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap sm:border-l sm:border-slate-800 sm:pl-3">
            <span className="text-xs text-slate-500 self-center mr-1">Status:</span>
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  statusFilter === f
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blocked account warning */}
      {view === "blocked_account" && counts.blocked > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-sm text-amber-400">
          <span>⚠️</span>
          <span>These leads are on a blocked or rate-limited account. Resolve the account issue before any outreach.</span>
        </div>
      )}

      {/* Table */}
      <Card padding="none">
        <div className="p-4 border-b border-slate-800">
          <SectionHeader
            title="Leads"
            subtitle={`${filtered.length} of ${leads.length} shown`}
          />
        </div>
        <div className="p-4">
          <Table>
            <TableHead>
              <TableHeader>Temp</TableHeader>
              <TableHeader>Name</TableHeader>
              <TableHeader className="hidden sm:table-cell">Company</TableHeader>
              <TableHeader className="hidden md:table-cell">Channel</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader className="hidden lg:table-cell">Value</TableHeader>
              <TableHeader>Flags</TableHeader>
              <TableHeader className="hidden xl:table-cell">Notes</TableHeader>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center text-slate-500 py-8">
                    No leads match this view
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Badge variant={lead.temp}>{lead.temp}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-slate-200">{lead.name}</div>
                        <div className="text-xs text-slate-500 sm:hidden">{lead.company}</div>
                        <div className="text-xs text-slate-500">{lead.role}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-slate-400">
                      {lead.company}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <span className="text-xs text-slate-400">{lead.channel}</span>
                        {lead.accountHandle && (
                          <div className="text-xs text-slate-600 font-mono">{lead.accountHandle}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lead.status}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-sm text-slate-300">
                      {lead.value}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {lead.accountBlocked && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap">
                            🔒 Blocked
                          </span>
                        )}
                        {lead.awaitingApproval && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                            ⏳ Approval
                          </span>
                        )}
                        {(lead.overdueDays ?? 0) >= 5 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                            ⏰ {lead.overdueDays}d overdue
                          </span>
                        )}
                        {canSend(lead) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                            ✓ Sendable
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-xs text-slate-500 line-clamp-1 max-w-48">{lead.notes}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
