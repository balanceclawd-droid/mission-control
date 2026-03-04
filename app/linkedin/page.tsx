"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
type LinkedInSegment = "all";

/* ─────────────────────── Types ─────────────────────────────── */

type TimeWindow = "7d" | "30d" | "all";

interface KpiData {
  isMock: boolean;
  sent: number;
  replied: number;
  replyRate: number;
  positiveRate: number;
  medianReply: string;
  hotReplies: { name: string; url: string; repliedAt: string }[];
  needsFollowUp: { name: string; url: string }[];
  unmatchedCount: number;
  profiles?: Array<any>;
  templates?: Array<any>;
}

/* ─────────────────────── Static config ─────────────────────── */

const segments: Array<{ value: LinkedInSegment; label: string }> = [
  { value: "all", label: "All" },
];

const timeWindows: Array<{ value: TimeWindow; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

const statusStyles: Record<string, string> = {
  processed: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  drafted: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  sent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  replied: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  no_response: "bg-slate-500/15 text-slate-500 border-slate-700",
};

const statusLabel: Record<string, string> = {
  processed: "Processed",
  drafted: "Draft Ready",
  sent: "Sent",
  replied: "Replied",
  no_response: "No Response",
};

/* ─────────────────────── Relative time helper ──────────────── */

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (diff < 1) return `${Math.round(diff * 60)}m ago`;
  if (diff < 24) return `${Math.round(diff)}h ago`;
  return `${Math.round(diff / 24)}d ago`;
}

/* ─────────────────────── KPI skeleton ──────────────────────── */

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-[#0f1623] border border-slate-800 rounded-lg p-4 h-24" />
      ))}
    </div>
  );
}

/* ─────────────────────── Page ──────────────────────────────── */

export default function LinkedInPage() {
  const [segment, setSegment] = useState<LinkedInSegment>("all");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("30d");
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  // Fetch KPI from API whenever time window changes
  useEffect(() => {
    setKpiLoading(true);
    fetch(`/api/linkedin-metrics?window=${timeWindow}`)
      .then((r) => r.json())
      .then((data: KpiData) => {
        setKpi(data);
        setKpiLoading(false);
      })
      .catch(() => setKpiLoading(false));
  }, [timeWindow]);

  const filteredProfiles = useMemo(
    () => (kpi?.profiles ?? []),
    [kpi]
  );

  const filteredTemplates = useMemo(
    () => (kpi?.templates ?? []),
    [kpi]
  );

  const topTemplates = [...filteredTemplates].sort((a, b) => b.replyRate - a.replyRate);

  const metrics = useMemo(() => {
    const total = filteredProfiles.length;
    const processed = filteredProfiles.filter((p) => p.status === "processed").length;
    const drafted = filteredProfiles.filter((p) => p.status === "drafted").length;
    const sentCount = filteredProfiles.filter((p) => p.status === "sent").length;
    const repliedCount = filteredProfiles.filter((p) => p.status === "replied").length;
    const noResponse = 0;
    return { total, processed, drafted, sent: sentCount, replied: repliedCount, noResponse };
  }, [filteredProfiles]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">LinkedIn Pipeline Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track processed, drafted, and sent outreach — with real-time KPI metrics
          </p>
        </div>

        {/* Time window selector */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {timeWindows.map((w) => (
            <button
              key={w.value}
              onClick={() => setTimeWindow(w.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                timeWindow === w.value
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI cards (real data) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Outreach KPIs
          </span>
          {kpi?.isMock && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
              sample data
            </span>
          )}
          {!kpiLoading && !kpi?.isMock && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              live · CSV
            </span>
          )}
        </div>

        {kpiLoading ? (
          <KpiSkeleton />
        ) : kpi ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              label="Sent Leads"
              value={String(kpi.sent)}
              trend="neutral"
              sub="unique outreach"
            />
            <StatCard
              label="Replied Leads"
              value={String(kpi.replied)}
              trend={kpi.replied > 0 ? "up" : "neutral"}
              sub="at least 1 reply"
            />
            <StatCard
              label="Reply Rate"
              value={`${kpi.replyRate}%`}
              trend={kpi.replyRate >= 25 ? "up" : kpi.replyRate >= 15 ? "warn" : "down"}
              sub="lead-level"
            />
            <StatCard
              label="Positive Rate"
              value={`${kpi.positiveRate}%`}
              trend={kpi.positiveRate >= 50 ? "up" : kpi.positiveRate >= 30 ? "warn" : "down"}
              sub="of replied leads"
            />
            <StatCard
              label="Median Reply"
              value={kpi.medianReply}
              trend="neutral"
              sub="time to first reply"
            />
          </div>
        ) : (
          <p className="text-xs text-slate-600">Failed to load metrics</p>
        )}
      </div>

      {/* ── Operational lists ── */}
      {kpi && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Hot Replies */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader title="Hot Replies" subtitle="Replied in last 72h" />
              {kpi.hotReplies.length > 0 && (
                <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-400 border border-red-500/30">
                  {kpi.hotReplies.length}
                </span>
              )}
            </div>
            {kpi.hotReplies.length === 0 ? (
              <p className="text-xs text-slate-600 py-2">No recent replies</p>
            ) : (
              <div className="space-y-2">
                {kpi.hotReplies.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                    <span className="text-xs text-slate-200 truncate max-w-[140px]">{r.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">{relativeTime(r.repliedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Needs Follow Up */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader title="Needs Follow Up" subtitle="3–7 days, no reply" />
              {kpi.needsFollowUp.length > 0 && (
                <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {kpi.needsFollowUp.length}
                </span>
              )}
            </div>
            {kpi.needsFollowUp.length === 0 ? (
              <p className="text-xs text-slate-600 py-2">None pending</p>
            ) : (
              <div className="space-y-2">
                {kpi.needsFollowUp.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                    <span className="text-xs text-slate-200 truncate">{r.name}</span>
                    <span className="text-[10px] text-amber-500">follow up</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Unmatched Profiles */}
          <Card>
            <div className="mb-3">
              <SectionHeader title="Unmatched Profiles" subtitle="Anonymised LinkedIn members" />
            </div>
            <div className="flex flex-col items-center justify-center py-4 gap-1">
              <span className="text-3xl font-bold text-slate-100">{kpi.unmatchedCount}</span>
              <span className="text-xs text-slate-500">profiles without identity</span>
              <span className="text-[10px] text-slate-600 mt-1 text-center">
                These show as "LinkedIn Member" in the export
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* ── Segment filter (for pipeline table below) ── */}
      <div className="flex gap-1.5 flex-wrap items-center">
        <span className="text-xs text-slate-500 self-center mr-1">Segment:</span>
        {segments.map((s) => (
          <button
            key={s.value}
            onClick={() => setSegment(s.value)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize ${
              segment === s.value
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="text-xs text-slate-600 ml-2">(live pipeline data)</span>
      </div>

      {/* ── Segment metrics row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={String(metrics.total)} trend="neutral" />
        <StatCard label="Processed" value={String(metrics.processed)} trend="neutral" />
        <StatCard label="Drafted" value={String(metrics.drafted)} trend="neutral" />
        <StatCard label="Sent" value={String(metrics.sent)} trend="up" />
        <StatCard label="Replied" value={String(metrics.replied)} trend="up" />
        <StatCard label="No Response" value={String(metrics.noResponse)} trend="neutral" />
      </div>

      {/* ── Profile pipeline + Template analytics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile pipeline */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="p-4 border-b border-slate-800">
              <SectionHeader
                title="Profile Pipeline"
                subtitle={`${filteredProfiles.length} profiles${segment !== "all" ? ` · ${segment}` : ""}`}
              />
            </div>
            <div className="p-4">
              <Table>
                <TableHead>
                  <TableHeader>Name</TableHeader>
                  <TableHeader className="hidden sm:table-cell">Segment</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="hidden md:table-cell">Template</TableHeader>
                  <TableHeader className="hidden lg:table-cell">Processed</TableHeader>
                </TableHead>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-slate-200">{profile.name}</div>
                          <div className="text-xs text-slate-500">{profile.company} · {profile.role}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs text-slate-400 capitalize">{profile.segment}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusStyles[profile.status]}`}
                        >
                          {statusLabel[profile.status]}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-slate-500">{profile.templateUsed}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-slate-600">{profile.processedAt}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Template analytics + Drafts */}
        <div className="space-y-4">
          <Card>
            <SectionHeader
              title="Top Templates"
              subtitle={segment === "all" ? "All segments" : `${segment} segment`}
            />
            <div className="space-y-3">
              {topTemplates.map((tmpl, idx) => (
                <div key={tmpl.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-slate-600 shrink-0">#{idx + 1}</span>
                      <span className="text-xs text-slate-300 truncate">{tmpl.name}</span>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium ml-2 ${
                        tmpl.replyRate >= 35
                          ? "text-emerald-400"
                          : tmpl.replyRate >= 25
                          ? "text-amber-400"
                          : "text-slate-400"
                      }`}
                    >
                      {tmpl.replyRate}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div
                      className={`h-1.5 rounded-full ${
                        tmpl.replyRate >= 35
                          ? "bg-emerald-500"
                          : tmpl.replyRate >= 25
                          ? "bg-amber-500"
                          : "bg-slate-600"
                      }`}
                      style={{ width: `${tmpl.replyRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {tmpl.replies} replies / {tmpl.sent} sent
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Drafts ready */}
          <Card>
            <SectionHeader title="Drafts Queued" subtitle="Ready to send" />
            <div className="space-y-2">
              {filteredProfiles.filter((p) => p.draftReady).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0"
                >
                  <div>
                    <div className="text-sm text-slate-200">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.company}</div>
                  </div>
                  <button className="px-2.5 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors">
                    Review →
                  </button>
                </div>
              ))}
              {filteredProfiles.filter((p) => p.draftReady).length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No drafts ready</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
