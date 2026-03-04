export const kpis = [
  {
    id: "mrr",
    label: "MRR",
    value: "£12,400",
    change: "+18%",
    trend: "up" as const,
    sub: "vs last month",
  },
  {
    id: "pipeline",
    label: "Pipeline Value",
    value: "£84,000",
    change: "+5 deals",
    trend: "up" as const,
    sub: "across 12 prospects",
  },
  {
    id: "open_tasks",
    label: "Open Tasks",
    value: "23",
    change: "-4",
    trend: "down" as const,
    sub: "since yesterday",
  },
  {
    id: "automations",
    label: "Automations Running",
    value: "9",
    change: "2 failing",
    trend: "warn" as const,
    sub: "check automations",
  },
];

export const recentActivity = [
  {
    id: "1",
    type: "lead",
    text: "New lead captured: Alex Turner @ Vortex Labs",
    time: "2m ago",
    icon: "👤",
  },
  {
    id: "2",
    type: "automation",
    text: "Automation 'Enreach Lead Sync' completed — 3 new entries",
    time: "14m ago",
    icon: "⚡",
  },
  {
    id: "3",
    type: "task",
    text: "Task closed: Draft proposal for DeFi Protocol X",
    time: "1h ago",
    icon: "✅",
  },
  {
    id: "4",
    type: "deal",
    text: "Deal moved to Negotiation: Apex Marketing (£8k/mo)",
    time: "2h ago",
    icon: "💰",
  },
  {
    id: "5",
    type: "automation",
    text: "Automation 'LinkedIn Follow-ups' failed — needs attention",
    time: "3h ago",
    icon: "🔴",
  },
  {
    id: "6",
    type: "lead",
    text: "Lead enriched: Sara Kim @ NovaBridge",
    time: "5h ago",
    icon: "🔍",
  },
];

export const tasks = [
  { id: "t1", title: "Send follow-up to Vortex Labs", priority: "high" as const, due: "Today" },
  { id: "t2", title: "Review Q1 campaign report", priority: "medium" as const, due: "Tomorrow" },
  { id: "t3", title: "Update Notion pipeline", priority: "low" as const, due: "Thu" },
  { id: "t4", title: "Prep deck for Apex call", priority: "high" as const, due: "Today" },
  { id: "t5", title: "Respond to Enreach DMs", priority: "medium" as const, due: "Fri" },
];

export const pipelineDeals = [
  { id: "d1", name: "Vortex Labs", stage: "Proposal", value: "£12,000/mo", temp: "hot" as const },
  { id: "d2", name: "Apex Marketing", stage: "Negotiation", value: "£8,000/mo", temp: "hot" as const },
  { id: "d3", name: "NovaBridge", stage: "Discovery", value: "£5,000/mo", temp: "warm" as const },
  { id: "d4", name: "DeFi Protocol X", stage: "Proposal", value: "£15,000/mo", temp: "warm" as const },
  { id: "d5", name: "Stellar DAO", stage: "Outreach", value: "£3,500/mo", temp: "cold" as const },
];
