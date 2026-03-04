export type AutomationStatus = "running" | "failing" | "paused" | "idle";

export interface AutomationEvent {
  id: string;
  timestamp: string;
  type: "run" | "success" | "failure" | "skip" | "warn";
  message: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  schedule: string;
  nextRun: string;
  lastRun: string;
  owner: string;
  successRate: number;
  failureReasons?: string[];
  deliveryHealth?: "healthy" | "degraded" | "failing" | "unknown";
  recentEvents: AutomationEvent[];
}

export const automations: Automation[] = [
  {
    id: "a1",
    name: "Enreach Lead Capture",
    description: "Polls Enreach DMs, extracts leads, logs to Notion",
    status: "running",
    schedule: "Every 12h",
    nextRun: "In 4h 22m",
    lastRun: "7h ago",
    owner: "Lester",
    successRate: 96,
    deliveryHealth: "healthy",
    recentEvents: [
      { id: "e1-1", timestamp: "7h ago", type: "success", message: "Run complete. 2 new leads captured, 1 reply logged." },
      { id: "e1-2", timestamp: "19h ago", type: "success", message: "Run complete. No new activity." },
      { id: "e1-3", timestamp: "2d ago", type: "warn", message: "@enreach_account_1 rate-limited. Switched to backup scrape mode." },
      { id: "e1-4", timestamp: "2d ago", type: "success", message: "Run complete. 4 new leads, 2 replies." },
    ],
  },
  {
    id: "a2",
    name: "LinkedIn Follow-ups",
    description: "Drafts follow-up DMs for leads messaged 3+ days ago",
    status: "failing",
    schedule: "Daily @ 09:00",
    nextRun: "Tomorrow 09:00",
    lastRun: "1d ago (failed)",
    owner: "Lester",
    successRate: 72,
    deliveryHealth: "failing",
    failureReasons: [
      "LinkedIn session cookie expired — re-auth required",
      "Browser fingerprint challenge triggered on login",
    ],
    recentEvents: [
      { id: "e2-1", timestamp: "1d ago", type: "failure", message: "Session cookie expired. LinkedIn login blocked. Manual re-auth needed." },
      { id: "e2-2", timestamp: "2d ago", type: "success", message: "5 follow-ups drafted. Notion updated." },
      { id: "e2-3", timestamp: "3d ago", type: "failure", message: "Fingerprint challenge. Aborted." },
      { id: "e2-4", timestamp: "4d ago", type: "success", message: "3 follow-ups drafted." },
    ],
  },
  {
    id: "a3",
    name: "Notion Pipeline Sync",
    description: "Syncs deal stages and updates timestamps in Notion",
    status: "running",
    schedule: "Every 6h",
    nextRun: "In 2h 10m",
    lastRun: "4h ago",
    owner: "Lester",
    successRate: 99,
    deliveryHealth: "healthy",
    recentEvents: [
      { id: "e3-1", timestamp: "4h ago", type: "success", message: "12 records synced. No conflicts." },
      { id: "e3-2", timestamp: "10h ago", type: "success", message: "11 records synced." },
      { id: "e3-3", timestamp: "16h ago", type: "success", message: "15 records synced." },
    ],
  },
  {
    id: "a4",
    name: "X / Twitter Content Draft",
    description: "Generates 3 post drafts based on recent activity",
    status: "idle",
    schedule: "Weekly Mon 10:00",
    nextRun: "Mon 10:00",
    lastRun: "5d ago",
    owner: "Lester",
    successRate: 88,
    deliveryHealth: "unknown",
    failureReasons: ["No delivery target configured — output is discarded"],
    recentEvents: [
      { id: "e4-1", timestamp: "5d ago", type: "warn", message: "3 drafts generated but no delivery target configured. Output discarded." },
      { id: "e4-2", timestamp: "12d ago", type: "success", message: "3 drafts generated. Sent to Telegram." },
    ],
  },
  {
    id: "a5",
    name: "Perp Farmer Lead Scout",
    description: "Searches X for active perp traders, logs to sheet",
    status: "paused",
    schedule: "Manual",
    nextRun: "—",
    lastRun: "3d ago",
    owner: "Lester",
    successRate: 91,
    deliveryHealth: "healthy",
    recentEvents: [
      { id: "e5-1", timestamp: "3d ago", type: "success", message: "47 profiles found, 12 qualified. Logged to Google Sheet." },
    ],
  },
  {
    id: "a6",
    name: "Heartbeat Check",
    description: "Polls email, calendar, mentions every 30min",
    status: "running",
    schedule: "Every 30m",
    nextRun: "In 12m",
    lastRun: "18m ago",
    owner: "Lester",
    successRate: 100,
    deliveryHealth: "healthy",
    recentEvents: [
      { id: "e6-1", timestamp: "18m ago", type: "success", message: "No new emails, no upcoming events. HEARTBEAT_OK." },
      { id: "e6-2", timestamp: "48m ago", type: "success", message: "Calendar alert: meeting in 1h." },
      { id: "e6-3", timestamp: "78m ago", type: "success", message: "HEARTBEAT_OK." },
    ],
  },
  {
    id: "a7",
    name: "Notion Target Dedup",
    description: "Deduplicates outreach targets against Notion Lead Intake",
    status: "idle",
    schedule: "Manual",
    nextRun: "—",
    lastRun: "1d ago",
    owner: "Lester",
    successRate: 95,
    deliveryHealth: "unknown",
    failureReasons: ["No delivery target configured"],
    recentEvents: [
      { id: "e7-1", timestamp: "1d ago", type: "success", message: "34 handles deduplicated. 8 dupes removed. No delivery target set." },
    ],
  },
  {
    id: "a8",
    name: "PhantomBuster Scraper",
    description: "Scrapes LinkedIn search results for ICP targets",
    status: "failing",
    schedule: "Daily @ 08:00",
    nextRun: "Tomorrow 08:00",
    lastRun: "1d ago (failed)",
    owner: "PhantomBuster",
    successRate: 61,
    deliveryHealth: "failing",
    failureReasons: [
      "PhantomBuster quota exceeded — upgrade plan or wait 24h",
      "API returned 429 Too Many Requests",
    ],
    recentEvents: [
      { id: "e8-1", timestamp: "1d ago", type: "failure", message: "API 429 — daily quota exceeded. No data scraped." },
      { id: "e8-2", timestamp: "2d ago", type: "failure", message: "API 429 — quota exceeded." },
      { id: "e8-3", timestamp: "3d ago", type: "success", message: "72 profiles scraped and logged." },
    ],
  },
  {
    id: "a9",
    name: "Weekly Agency Report",
    description: "Compiles KPIs, pipeline, and tasks into a summary",
    status: "running",
    schedule: "Weekly Fri 17:00",
    nextRun: "Fri 17:00",
    lastRun: "5d ago",
    owner: "Lester",
    successRate: 100,
    deliveryHealth: "healthy",
    recentEvents: [
      { id: "e9-1", timestamp: "5d ago", type: "success", message: "Weekly report compiled and sent to Ryan on Telegram." },
      { id: "e9-2", timestamp: "12d ago", type: "success", message: "Weekly report compiled and sent." },
    ],
  },
];
