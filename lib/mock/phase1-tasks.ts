// Phase 1 – Task Board + Mini Sprint mock data
// Wire real data: pull from Asana, Notion Tasks DB, or local JSON config.

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskList = "today" | "blocked" | "backlog";

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  list: TaskList; // "today" = To Do Today, "blocked" = right now / short/blocked
  estimateMinutes: number; // <=5 = mini-sprint candidate
  ageHours: number; // how long it's been sitting
  annoyanceScore: number; // 1-10
  annoyanceReason: string;
  blocked?: boolean;
  blockedBy?: string;
  tags: string[];
}

export const tasks: Task[] = [
  {
    id: "t1",
    title: "Send follow-up to Vortex Labs (Alex Turner)",
    priority: "critical",
    list: "today",
    estimateMinutes: 3,
    ageHours: 18,
    annoyanceScore: 9,
    annoyanceReason: "Proposal sitting unanswered — deal could go cold",
    tags: ["leads", "linkedin"],
  },
  {
    id: "t2",
    title: "Prep deck for Apex Marketing call (Thursday)",
    priority: "high",
    list: "today",
    estimateMinutes: 45,
    ageHours: 12,
    annoyanceScore: 8,
    annoyanceReason: "Call in 2 days, still no deck",
    tags: ["sales", "deck"],
  },
  {
    id: "t3",
    title: "Respond to Rachel Davies — send case studies",
    priority: "high",
    list: "today",
    estimateMinutes: 5,
    ageHours: 6,
    annoyanceScore: 7,
    annoyanceReason: "She asked today — warm lead, don't leave her waiting",
    tags: ["leads", "linkedin"],
  },
  {
    id: "t4",
    title: "Fix LinkedIn Follow-ups automation (failing)",
    priority: "high",
    list: "today",
    estimateMinutes: 20,
    ageHours: 24,
    annoyanceScore: 8,
    annoyanceReason: "Automation down since yesterday — missing follow-ups",
    tags: ["automations", "debug"],
  },
  {
    id: "t5",
    title: "Update Notion pipeline stages",
    priority: "medium",
    list: "today",
    estimateMinutes: 5,
    ageHours: 48,
    annoyanceScore: 5,
    annoyanceReason: "Pipeline data getting stale — makes reports unreliable",
    tags: ["notion", "admin"],
  },
  {
    id: "t6",
    title: "Review Q1 campaign report",
    priority: "medium",
    list: "today",
    estimateMinutes: 30,
    ageHours: 36,
    annoyanceScore: 4,
    annoyanceReason: "Requested by client last week",
    tags: ["reporting"],
  },
  {
    id: "t7",
    title: "Approve Enreach DM drafts (5 queued)",
    priority: "critical",
    list: "blocked",
    estimateMinutes: 4,
    ageHours: 8,
    annoyanceScore: 10,
    annoyanceReason: "Holding up outreach — leads going cold",
    blocked: true,
    blockedBy: "Waiting for Ryan to approve",
    tags: ["approvals", "enreach"],
  },
  {
    id: "t8",
    title: "Reply to Dan Fox (Blockwave) — re-engage",
    priority: "medium",
    list: "blocked",
    estimateMinutes: 3,
    ageHours: 120,
    annoyanceScore: 6,
    annoyanceReason: "5 days old — getting stale, low urgency but annoying",
    tags: ["leads", "enreach"],
  },
  {
    id: "t9",
    title: "Write LinkedIn post on DeFi GTM mistakes",
    priority: "low",
    list: "blocked",
    estimateMinutes: 2,
    ageHours: 72,
    annoyanceScore: 3,
    annoyanceReason: "Good content idea, keeps slipping",
    tags: ["content", "linkedin"],
  },
  {
    id: "t10",
    title: "Check PhantomBuster scraper logs",
    priority: "medium",
    list: "blocked",
    estimateMinutes: 5,
    ageHours: 30,
    annoyanceScore: 6,
    annoyanceReason: "Scraper failing — need to diagnose",
    blocked: true,
    blockedBy: "PhantomBuster account issue",
    tags: ["automations", "debug"],
  },
  {
    id: "t11",
    title: "Send scope doc to ZeroGas Protocol (Priya)",
    priority: "high",
    list: "today",
    estimateMinutes: 10,
    ageHours: 16,
    annoyanceScore: 7,
    annoyanceReason: "Discovery call done — scope delivery overdue",
    tags: ["leads", "proposals"],
  },
  {
    id: "t12",
    title: "Archive cold leads with no reply in 30d",
    priority: "low",
    list: "backlog",
    estimateMinutes: 5,
    ageHours: 200,
    annoyanceScore: 2,
    annoyanceReason: "Pipeline hygiene — not urgent",
    tags: ["admin", "notion"],
  },
];

// Scoring: annoyanceScore * 3 + priority weight + age weight
export function weightedScore(task: Task): number {
  const priorityMap: Record<TaskPriority, number> = { critical: 40, high: 30, medium: 20, low: 10 };
  const ageWeight = Math.min(task.ageHours / 24, 5) * 5; // max 25 pts
  return task.annoyanceScore * 3 + priorityMap[task.priority] + ageWeight;
}

export function getMiniSprintTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.estimateMinutes <= 5)
    .sort((a, b) => weightedScore(b) - weightedScore(a));
}
