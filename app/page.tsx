import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { kpis, recentActivity, tasks, pipelineDeals } from "@/lib/mock/kpis";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-slate-100">Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Good to have you back, Ryan.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
            sub={kpi.sub}
          />
        ))}
      </div>

      {/* Middle row: Activity + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <Card>
          <SectionHeader title="Recent Activity" subtitle="Last 12 hours" />
          <div className="space-y-0">
            {recentActivity.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 py-2.5 ${
                  idx < recentActivity.length - 1 ? "border-b border-slate-800/60" : ""
                }`}
              >
                <span className="text-base leading-none mt-0.5 shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">{item.text}</p>
                </div>
                <span className="text-xs text-slate-600 shrink-0 mt-0.5">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tasks */}
        <Card>
          <SectionHeader
            title="Open Tasks"
            subtitle={`${tasks.length} items`}
            action={
              <span className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
                View all →
              </span>
            }
          />
          <div className="space-y-0">
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 py-2.5 ${
                  idx < tasks.length - 1 ? "border-b border-slate-800/60" : ""
                }`}
              >
                <div className="w-4 h-4 rounded border border-slate-700 shrink-0 hover:border-slate-500 cursor-pointer transition-colors" />
                <span className="flex-1 text-sm text-slate-300 min-w-0 truncate">{task.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={task.priority}>{task.priority}</Badge>
                  <span className="text-xs text-slate-600">{task.due}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <SectionHeader
          title="Pipeline"
          subtitle={`${pipelineDeals.length} active deals`}
          action={
            <a href="/leads" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              View leads →
            </a>
          }
        />
        <div className="space-y-0">
          {pipelineDeals.map((deal, idx) => (
            <div
              key={deal.id}
              className={`flex items-center gap-3 py-2.5 ${
                idx < pipelineDeals.length - 1 ? "border-b border-slate-800/60" : ""
              }`}
            >
              <Badge variant={deal.temp}>{deal.temp}</Badge>
              <span className="flex-1 text-sm text-slate-200 font-medium min-w-0 truncate">
                {deal.name}
              </span>
              <span className="text-xs text-slate-500 hidden sm:block">{deal.stage}</span>
              <span className="text-sm font-mono text-slate-300 shrink-0">{deal.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
