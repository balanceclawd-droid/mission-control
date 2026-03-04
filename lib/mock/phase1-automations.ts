// Phase 1 – Extended Automations / Cron Diagnostics mock data
// Wire real data: OpenClaw cron config, Lester session state, delivery logs.

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  lastRun: string;
  deliveryTarget: string | null; // null = missing — highlighted in UI
  deliveryStatus: "ok" | "failed" | "no_target" | "partial";
  failureReason?: string;
  successRate: number;
  status: "running" | "failing" | "paused" | "idle";
}

export interface AccountSendStats {
  accountHandle: string;
  channel: "LinkedIn" | "Enreach" | "Telegram" | "Twitter/X";
  sentLast7d: number;
  failedLast7d: number;
  failureReasons: string[];
  blocked: boolean;
  blockReason?: string;
}

export interface CronError {
  id: string;
  jobId: string;
  jobName: string;
  timestamp: string;
  error: string;
  severity: "warn" | "error" | "critical";
}

export const cronJobs: CronJob[] = [
  {
    id: "cj1",
    name: "Enreach Lead Capture",
    schedule: "Every 12h",
    nextRun: "In 4h 22m",
    lastRun: "7h ago",
    deliveryTarget: "Telegram → Ryan",
    deliveryStatus: "ok",
    successRate: 96,
    status: "running",
  },
  {
    id: "cj2",
    name: "LinkedIn Follow-ups",
    schedule: "Daily @ 09:00",
    nextRun: "Tomorrow 09:00",
    lastRun: "1d ago",
    deliveryTarget: "Telegram → Ryan",
    deliveryStatus: "failed",
    failureReason: "LinkedIn session cookie expired — re-auth required",
    successRate: 72,
    status: "failing",
  },
  {
    id: "cj3",
    name: "Notion Pipeline Sync",
    schedule: "Every 6h",
    nextRun: "In 2h 10m",
    lastRun: "4h ago",
    deliveryTarget: "Notion DB → Lead Intake",
    deliveryStatus: "ok",
    successRate: 99,
    status: "running",
  },
  {
    id: "cj4",
    name: "X / Twitter Content Draft",
    schedule: "Weekly Mon 10:00",
    nextRun: "Mon 10:00",
    lastRun: "5d ago",
    deliveryTarget: null, // missing target — highlighted
    deliveryStatus: "no_target",
    failureReason: "No delivery target configured",
    successRate: 88,
    status: "idle",
  },
  {
    id: "cj5",
    name: "Perp Farmer Lead Scout",
    schedule: "Manual",
    nextRun: "—",
    lastRun: "3d ago",
    deliveryTarget: "Google Sheet → Perp Leads",
    deliveryStatus: "ok",
    successRate: 91,
    status: "paused",
  },
  {
    id: "cj6",
    name: "Heartbeat Check",
    schedule: "Every 30m",
    nextRun: "In 12m",
    lastRun: "18m ago",
    deliveryTarget: "Telegram → Ryan",
    deliveryStatus: "ok",
    successRate: 100,
    status: "running",
  },
  {
    id: "cj7",
    name: "Notion Target Dedup",
    schedule: "Manual",
    nextRun: "—",
    lastRun: "1d ago",
    deliveryTarget: null, // missing
    deliveryStatus: "no_target",
    failureReason: "No delivery target configured",
    successRate: 95,
    status: "idle",
  },
  {
    id: "cj8",
    name: "PhantomBuster Scraper",
    schedule: "Daily @ 08:00",
    nextRun: "Tomorrow 08:00",
    lastRun: "1d ago",
    deliveryTarget: "Google Sheet → ICP Targets",
    deliveryStatus: "failed",
    failureReason: "PhantomBuster quota exceeded — upgrade plan or wait 24h",
    successRate: 61,
    status: "failing",
  },
  {
    id: "cj9",
    name: "Weekly Agency Report",
    schedule: "Weekly Fri 17:00",
    nextRun: "Fri 17:00",
    lastRun: "5d ago",
    deliveryTarget: "Telegram → Ryan",
    deliveryStatus: "ok",
    successRate: 100,
    status: "running",
  },
];

export const accountSendStats: AccountSendStats[] = [
  {
    accountHandle: "@ryan_clawd_li",
    channel: "LinkedIn",
    sentLast7d: 47,
    failedLast7d: 3,
    failureReasons: ["Session expired (2)", "Rate limit hit (1)"],
    blocked: false,
  },
  {
    accountHandle: "@enreach_account_1",
    channel: "Enreach",
    sentLast7d: 32,
    failedLast7d: 8,
    failureReasons: ["Account flagged (5)", "Delivery timeout (3)"],
    blocked: true,
    blockReason: "Account temporarily suspended — suspected spam flag",
  },
  {
    accountHandle: "@lester_tg",
    channel: "Telegram",
    sentLast7d: 21,
    failedLast7d: 0,
    failureReasons: [],
    blocked: false,
  },
  {
    accountHandle: "@ryan_x",
    channel: "Twitter/X",
    sentLast7d: 5,
    failedLast7d: 1,
    failureReasons: ["API rate limit (1)"],
    blocked: false,
  },
];

export const cronErrors: CronError[] = [
  {
    id: "ce1",
    jobId: "cj2",
    jobName: "LinkedIn Follow-ups",
    timestamp: "1d ago",
    error: "LinkedIn session cookie expired. Please re-authenticate via browser.",
    severity: "critical",
  },
  {
    id: "ce2",
    jobId: "cj8",
    jobName: "PhantomBuster Scraper",
    timestamp: "1d ago",
    error: "PhantomBuster API returned 429 — daily quota exceeded.",
    severity: "error",
  },
  {
    id: "ce3",
    jobId: "cj4",
    jobName: "X / Twitter Content Draft",
    timestamp: "5d ago",
    error: "No delivery_target configured in cron spec. Job ran but output was discarded.",
    severity: "warn",
  },
  {
    id: "ce4",
    jobId: "cj7",
    jobName: "Notion Target Dedup",
    timestamp: "1d ago",
    error: "No delivery_target configured. Results not sent anywhere.",
    severity: "warn",
  },
  {
    id: "ce5",
    jobId: "cj1",
    jobName: "Enreach Lead Capture",
    timestamp: "2d ago",
    error: "Enreach account @enreach_account_1 rate-limited. Switched to backup scrape mode.",
    severity: "warn",
  },
];
