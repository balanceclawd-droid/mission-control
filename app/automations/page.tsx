"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { automations, type Automation, type AutomationEvent } from "@/lib/mock/automations";
import { cronJobs, accountSendStats, cronErrors } from "@/lib/mock/phase1-automations";
import type { AutomationStatus } from "@/lib/mock/automations";

type ViewTab = "overview" | "diagnostics";

function statusIcon(status: AutomationStatus) {
  const map: Record<AutomationStatus, string> = {
    running: "🟢",
    failing: "🔴",
    paused: "⏸️",
    idle: "⚪",
  };
  return map[status];
}

const deliveryStatusStyles: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  no_target: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  partial: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const deliveryStatusLabels: Record<string, string> = {
  ok: "OK",
  failed: "Failed",
  no_target: "No Target",
  partial: "Partial",
};

const deliveryHealthStyles: Record<string, string> = {
  healthy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  degraded: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  failing: "bg-red-500/15 text-red-400 border-red-500/30",
  unknown: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const errorSeverityStyles: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/25 text-red-400",
  error: "bg-orange-500/10 border-orange-500/25 text-orange-400",
  warn: "bg-amber-500/10 border-amber-500/25 text-amber-400",
};

const errorSeverityIcons: Record<string, string> = {
  critical: "🔴",
  error: "🟠",
  warn: "🟡",
};

const eventTypeStyles: Record<AutomationEvent["type"], string> = {
  success: "text-emerald-400",
  failure: "text-red-400",
  warn: "text-amber-400",
  run: "text-slate-400",
  skip: "text-slate-500",
};

const eventTypeIcons: Record<AutomationEvent["type"], string> = {
  success: "✅",
  failure: "❌",
  warn: "⚠️",
  run: "▶",
  skip: "⏭",
};

// ── Automation Detail Panel ─────────────────────────────────────────────────────
function AutomationDetailPanel({ auto, onClose }: { auto: Automation; onClose: () => void }) {
  const healthKey = auto.deliveryHealth ?? "unknown";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg bg-[#0b0f19] border-l border-slate-700 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0b0f19] border-b border-slate-800 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span>{statusIcon(auto.status)}</span>
              <span className="text-sm font-semibold text-slate-200">{auto.name}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{auto.description}</div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none shrink-0 mt-0.5"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Schedule + Run Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-[#0f1623] p-3">
              <div className="text-xs text-slate-500 mb-1">Schedule</div>
              <div className="text-sm font-mono text-slate-300">{auto.schedule}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0f1623] p-3">
              <div className="text-xs text-slate-500 mb-1">Owner</div>
              <div className="text-sm text-slate-300">{auto.owner}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0f1623] p-3">
              <div className="text-xs text-slate-500 mb-1">Next Run</div>
              <div className="text-sm text-slate-300">{auto.nextRun}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0f1623] p-3">
              <div className="text-xs text-slate-500 mb-1">Last Run</div>
              <div className="text-sm text-slate-300">{auto.lastRun}</div>
            </div>
          </div>

          {/* Delivery Health + Success Rate */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Delivery health:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${deliveryHealthStyles[healthKey]}`}>
                {healthKey}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Success rate:</span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 rounded-full bg-slate-800 w-20">
                  <div
                    className={`h-1.5 rounded-full ${auto.successRate >= 90 ? "bg-emerald-500" : auto.successRate >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${auto.successRate}%` }}
                  />
                </div>
                <span className="text-xs text-slate-300">{auto.successRate}%</span>
              </div>
            </div>
          </div>

          {/* Failure Reasons */}
          {auto.failureReasons && auto.failureReasons.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-400 mb-2">Failure Reasons</div>
              <div className="space-y-1.5">
                {auto.failureReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                    <span className="shrink-0 mt-0.5">❌</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Events Feed */}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">Recent Events</div>
            {auto.recentEvents.length === 0 ? (
              <p className="text-xs text-slate-600">No events recorded.</p>
            ) : (
              <div className="space-y-2">
                {auto.recentEvents.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-2.5 text-xs">
                    <span className={`shrink-0 mt-0.5 ${eventTypeStyles[evt.type]}`}>
                      {eventTypeIcons[evt.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={`font-medium ${eventTypeStyles[evt.type]}`}>{evt.type}</span>
                      <span className="text-slate-600 mx-1.5">·</span>
                      <span className="text-slate-500">{evt.timestamp}</span>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">{evt.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AutomationsPage() {
  const [view, setView] = useState<ViewTab>("overview");
  const [selectedAuto, setSelectedAuto] = useState<Automation | null>(null);

  const running = automations.filter((a) => a.status === "running").length;
  const failing = automations.filter((a) => a.status === "failing").length;
  const paused = automations.filter((a) => a.status === "paused").length;
  const idle = automations.filter((a) => a.status === "idle").length;

  const missingTargets = cronJobs.filter((j) => j.deliveryTarget === null).length;
  const failingJobs = cronJobs.filter((j) => j.deliveryStatus === "failed").length;
  const blockedAccounts = accountSendStats.filter((a) => a.blocked).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Detail panel */}
      {selectedAuto && (
        <AutomationDetailPanel auto={selectedAuto} onClose={() => setSelectedAuto(null)} />
      )}

      <div>
        <h1 className="text-lg font-semibold text-slate-100">Automations</h1>
        <p className="text-xs text-slate-500 mt-0.5">Cron jobs, agents, background workflows, and delivery diagnostics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Running" value={String(running)} trend="up" />
        <StatCard label="Failing" value={String(failing)} trend={failing > 0 ? "down" : "up"} />
        <StatCard label="No Target" value={String(missingTargets)} trend={missingTargets > 0 ? "warn" : "neutral"} />
        <StatCard label="Blocked Accounts" value={String(blockedAccounts)} trend={blockedAccounts > 0 ? "warn" : "neutral"} />
      </div>

      {/* Alerts */}
      {failing > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm text-red-400">
          <span className="text-base">🔴</span>
          <span>
            <strong>{failing}</strong> automation{failing > 1 ? "s" : ""} failing — review required
          </span>
        </div>
      )}
      {missingTargets > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-sm text-amber-400">
          <span className="text-base">⚠️</span>
          <span>
            <strong>{missingTargets}</strong> job{missingTargets > 1 ? "s" : ""} have no delivery target configured — outputs are being discarded
          </span>
        </div>
      )}

      {/* View tabs */}
      <div className="flex gap-1.5 border-b border-slate-800 pb-3">
        <button
          onClick={() => setView("overview")}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            view === "overview" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setView("diagnostics")}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            view === "diagnostics" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
          }`}
        >
          Diagnostics
        </button>
      </div>

      {view === "overview" && (
        <Card padding="none">
          <div className="p-4 border-b border-slate-800">
            <SectionHeader title="All Automations" subtitle={`${automations.length} total · click a row to view details`} />
          </div>
          <div className="p-4">
            <Table>
              <TableHead>
                <TableHeader>Status</TableHeader>
                <TableHeader>Name</TableHeader>
                <TableHeader className="hidden md:table-cell">Schedule</TableHeader>
                <TableHeader className="hidden lg:table-cell">Next Run</TableHeader>
                <TableHeader className="hidden xl:table-cell">Last Run</TableHeader>
                <TableHeader className="hidden lg:table-cell">Owner</TableHeader>
                <TableHeader className="hidden md:table-cell">Success %</TableHeader>
                <TableHeader><span /></TableHeader>
              </TableHead>
              <TableBody>
                {automations.map((auto) => (
                  <TableRow
                    key={auto.id}
                    className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                    onClick={() => setSelectedAuto(auto)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{statusIcon(auto.status)}</span>
                        <Badge variant={auto.status}>{auto.status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-slate-200">{auto.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 hidden sm:block">{auto.description}</div>
                        {auto.failureReasons && auto.failureReasons.length > 0 && (
                          <div className="text-xs text-red-400 mt-0.5 hidden sm:block truncate max-w-[200px]">
                            ↳ {auto.failureReasons[0]}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-xs text-slate-400">{auto.schedule}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{auto.nextRun}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-xs text-slate-500">{auto.lastRun}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{auto.owner}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 max-w-16">
                          <div
                            className={`h-1.5 rounded-full ${
                              auto.successRate >= 90 ? "bg-emerald-500" : auto.successRate >= 70 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${auto.successRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{auto.successRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAuto(auto); }}
                        className="px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        Details →
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {view === "diagnostics" && (
        <div className="space-y-6">
          {/* Cron jobs with delivery info */}
          <Card padding="none">
            <div className="p-4 border-b border-slate-800">
              <SectionHeader title="Cron Jobs — Delivery Status" subtitle="Next/last run and delivery target" />
            </div>
            <div className="p-4">
              <Table>
                <TableHead>
                  <TableHeader>Job</TableHeader>
                  <TableHeader className="hidden md:table-cell">Schedule</TableHeader>
                  <TableHeader className="hidden lg:table-cell">Next Run</TableHeader>
                  <TableHeader className="hidden lg:table-cell">Last Run</TableHeader>
                  <TableHeader>Delivery Target</TableHeader>
                  <TableHeader>Delivery</TableHeader>
                </TableHead>
                <TableBody>
                  {cronJobs.map((job) => (
                    <TableRow key={job.id} className={job.deliveryTarget === null ? "bg-amber-500/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {job.status === "running" ? "🟢" : job.status === "failing" ? "🔴" : job.status === "paused" ? "⏸️" : "⚪"}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-slate-200">{job.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-mono text-xs text-slate-400">{job.schedule}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-slate-400">{job.nextRun}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{job.lastRun}</span>
                      </TableCell>
                      <TableCell>
                        {job.deliveryTarget ? (
                          <span className="text-xs text-slate-400">{job.deliveryTarget}</span>
                        ) : (
                          <span className="text-xs text-amber-400 font-medium">⚠ Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${deliveryStatusStyles[job.deliveryStatus]}`}>
                          {deliveryStatusLabels[job.deliveryStatus]}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Account send volume */}
          <Card>
            <SectionHeader title="Account Send Volume" subtitle="Last 7 days" />
            <div className="space-y-3">
              {accountSendStats.map((acct) => (
                <div key={acct.accountHandle} className={`rounded-lg border p-3 ${acct.blocked ? "border-red-500/30 bg-red-500/5" : "border-slate-800"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200 font-mono">{acct.accountHandle}</span>
                        <span className="text-xs text-slate-500">{acct.channel}</span>
                        {acct.blocked && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                            🔒 Blocked
                          </span>
                        )}
                      </div>
                      {acct.blockReason && (
                        <div className="text-xs text-red-400 mt-0.5">{acct.blockReason}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-slate-200">{acct.sentLast7d} sent</div>
                      {acct.failedLast7d > 0 && (
                        <div className="text-xs text-red-400">{acct.failedLast7d} failed</div>
                      )}
                    </div>
                  </div>
                  {acct.failureReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {acct.failureReasons.map((reason) => (
                        <span key={reason} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Error feed */}
          <Card>
            <SectionHeader title="Error Feed" subtitle="Cron delivery failures" />
            <div className="space-y-2">
              {cronErrors.map((err) => (
                <div
                  key={err.id}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${errorSeverityStyles[err.severity]}`}
                >
                  <span className="text-base shrink-0 mt-0.5">{errorSeverityIcons[err.severity]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-medium">{err.jobName}</span>
                      <span className="text-xs opacity-70">{err.timestamp}</span>
                    </div>
                    <div className="text-xs opacity-80">{err.error}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
