"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { tools, type Tool, type ToolStatus, type ToolGroup } from "@/lib/mock/tools";

const GROUP_ORDER: ToolGroup[] = ["Outreach", "Ops", "Analytics", "Infrastructure", "Comms", "Finance"];

function StatusDot({ status }: { status: ToolStatus }) {
  const colors: Record<ToolStatus, string> = {
    active: "bg-emerald-500",
    degraded: "bg-amber-500",
    inactive: "bg-slate-600",
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${
        status === "active" ? "shadow-[0_0_6px_theme(colors.emerald.500)]" : ""
      }`}
    />
  );
}

// ── Tool Detail Panel ───────────────────────────────────────────────────────────
function ToolDetailPanel({ tool, onClose }: { tool: Tool; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md bg-[#0b0f19] border-l border-slate-700 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0b0f19] border-b border-slate-800 px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl leading-none mt-0.5">{tool.icon}</span>
            <div>
              <div className="text-sm font-semibold text-slate-200">{tool.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusDot status={tool.status} />
                <span className="text-xs text-slate-500 capitalize">{tool.status}</span>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">{tool.group}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none shrink-0 mt-0.5"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          <div>
            <div className="text-xs text-slate-500 mb-1">Description</div>
            <p className="text-sm text-slate-300">{tool.description}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-[#0f1623] p-3">
              <div className="text-xs text-slate-500 mb-1">Status</div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={tool.status} />
                <span className="text-sm text-slate-300 capitalize">{tool.status}</span>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0f1623] p-3">
              <div className="text-xs text-slate-500 mb-1">Group</div>
              <div className="text-sm text-slate-300">{tool.group}</div>
            </div>
            {tool.owner && (
              <div className="rounded-lg border border-slate-800 bg-[#0f1623] p-3">
                <div className="text-xs text-slate-500 mb-1">Owner</div>
                <div className="text-sm text-slate-300">{tool.owner}</div>
              </div>
            )}
            <div className="rounded-lg border border-slate-800 bg-[#0f1623] p-3">
              <div className="text-xs text-slate-500 mb-1">Category</div>
              <div className="text-sm text-slate-300">{tool.category}</div>
            </div>
          </div>

          {/* Notes */}
          {tool.notes && (
            <div>
              <div className="text-xs text-slate-500 mb-1.5">Notes</div>
              <p className="text-sm text-slate-400 leading-relaxed bg-[#0f1623] border border-slate-800 rounded-lg p-3">
                {tool.notes}
              </p>
            </div>
          )}

          {/* Dependencies */}
          {tool.dependencies && tool.dependencies.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-1.5">Dependencies</div>
              <div className="flex flex-wrap gap-1.5">
                {tool.dependencies.map((dep) => (
                  <span key={dep} className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded">
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External link */}
          {tool.url && (
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 hover:text-slate-100 transition-all w-full justify-center"
            >
              Open {tool.name} ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tool Card ───────────────────────────────────────────────────────────────────
function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  return (
    <div
      className="bg-[#0f1623] border border-slate-800 rounded-lg p-4 flex flex-col gap-3 hover:border-slate-600 transition-colors group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xl leading-none">{tool.icon}</span>
        <div className="flex items-center gap-1.5">
          <StatusDot status={tool.status} />
          <Badge variant={tool.status}>{tool.status}</Badge>
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-200 group-hover:text-slate-100 transition-colors">{tool.name}</div>
        <div className="text-xs text-slate-500 mt-0.5 leading-snug">{tool.description}</div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <Badge variant="default">{tool.group}</Badge>
        <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">Details →</span>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [filterGroup, setFilterGroup] = useState<ToolGroup | "All">("All");
  const [filterStatus, setFilterStatus] = useState<ToolStatus | "all">("all");

  const active = tools.filter((t) => t.status === "active").length;
  const degraded = tools.filter((t) => t.status === "degraded").length;
  const inactive = tools.filter((t) => t.status === "inactive").length;

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      if (filterGroup !== "All" && t.group !== filterGroup) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    });
  }, [filterGroup, filterStatus]);

  // Group filtered tools
  const grouped = useMemo(() => {
    const groupMap = new Map<ToolGroup, Tool[]>();
    for (const g of GROUP_ORDER) groupMap.set(g, []);
    for (const t of filtered) {
      groupMap.get(t.group)?.push(t);
    }
    return groupMap;
  }, [filtered]);

  const groupTabs: Array<ToolGroup | "All"> = ["All", ...GROUP_ORDER];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {selectedTool && <ToolDetailPanel tool={selectedTool} onClose={() => setSelectedTool(null)} />}

      <div>
        <h1 className="text-lg font-semibold text-slate-100">Tools</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {active} active · {degraded} degraded · {inactive} inactive
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={`flex items-center gap-3 cursor-pointer transition-colors ${filterStatus === "active" ? "border-emerald-500/40" : ""}`} onClick={() => setFilterStatus(filterStatus === "active" ? "all" : "active")}>
          <StatusDot status="active" />
          <div>
            <div className="text-xl font-bold text-slate-100">{active}</div>
            <div className="text-xs text-slate-500">Active</div>
          </div>
        </Card>
        <Card className={`flex items-center gap-3 cursor-pointer transition-colors ${filterStatus === "degraded" ? "border-amber-500/40" : ""}`} onClick={() => setFilterStatus(filterStatus === "degraded" ? "all" : "degraded")}>
          <StatusDot status="degraded" />
          <div>
            <div className="text-xl font-bold text-slate-100">{degraded}</div>
            <div className="text-xs text-slate-500">Degraded</div>
          </div>
        </Card>
        <Card className={`flex items-center gap-3 cursor-pointer transition-colors ${filterStatus === "inactive" ? "border-slate-500/40" : ""}`} onClick={() => setFilterStatus(filterStatus === "inactive" ? "all" : "inactive")}>
          <StatusDot status="inactive" />
          <div>
            <div className="text-xl font-bold text-slate-100">{inactive}</div>
            <div className="text-xs text-slate-500">Inactive</div>
          </div>
        </Card>
      </div>

      {/* Group filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {groupTabs.map((g) => (
          <button
            key={g}
            onClick={() => setFilterGroup(g)}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              filterGroup === g
                ? "bg-slate-700 text-slate-100"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
            }`}
          >
            {g}
            {g !== "All" && (
              <span className="ml-1 text-slate-600">
                ({tools.filter((t) => t.group === g).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 text-center py-8">No tools match this filter.</p>
        </Card>
      ) : filterGroup !== "All" ? (
        /* Single group view */
        <div>
          <SectionHeader
            title={filterGroup}
            subtitle={`${filtered.length} tool${filtered.length !== 1 ? "s" : ""} · click a card for details`}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onClick={() => setSelectedTool(tool)} />
            ))}
          </div>
        </div>
      ) : (
        /* Grouped view */
        <div className="space-y-6">
          {GROUP_ORDER.map((group) => {
            const groupTools = grouped.get(group) ?? [];
            if (groupTools.length === 0) return null;
            return (
              <section key={group} className="space-y-3">
                <SectionHeader
                  title={group}
                  subtitle={`${groupTools.length} tool${groupTools.length !== 1 ? "s" : ""}`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {groupTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} onClick={() => setSelectedTool(tool)} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
