import fs from "fs";
import path from "path";

export type LeadTemp = "hot" | "warm" | "cold";
export type LeadStatus =
  | "new"
  | "contacted"
  | "replied"
  | "meeting"
  | "proposal"
  | "closed"
  | "lost";

export interface MissionLead {
  id: string;
  name: string;
  company: string;
  role: string;
  channel: string;
  temp: LeadTemp;
  status: LeadStatus;
  value: string;
  lastContact: string;
  notes: string;
  accountHandle?: string;
  accountBlocked?: boolean;
  awaitingApproval?: boolean;
  overdueDays?: number;
}

interface NotionQueryResponse {
  results: Array<{
    id: string;
    properties: Record<string, any>;
    last_edited_time?: string;
    created_time?: string;
  }>;
  has_more?: boolean;
  next_cursor?: string | null;
}

const CREDS_PATH = process.env.ENREACH_CREDS_PATH ?? path.join(process.env.HOME ?? "/root", ".openclaw/credentials/enreach-lead-capture.json");

function getText(prop: any): string {
  const items = prop?.rich_text ?? prop?.title ?? [];
  return items.map((x: any) => x?.plain_text ?? "").join("").trim();
}

function getSelect(prop: any): string {
  return prop?.select?.name?.trim?.() ?? "";
}

function getCheckbox(prop: any): boolean {
  return Boolean(prop?.checkbox);
}

function getDate(prop: any): string {
  return prop?.date?.start ?? "";
}

function normStatus(s: string): LeadStatus {
  const v = s.toLowerCase();
  if (v.includes("replied") || v.includes("follow-up drafted") || v.includes("follow-up sent")) return "replied";
  if (v.includes("sent") || v.includes("approved") || v.includes("contacted")) return "contacted";
  if (v.includes("meeting") || v.includes("call")) return "meeting";
  if (v.includes("proposal")) return "proposal";
  if (v.includes("won") || v.includes("closed")) return "closed";
  if (v.includes("lost") || v.includes("cold") || v.includes("blocked")) return "lost";
  return "new";
}

function normTemp(status: string, hasReply: string): LeadTemp {
  const s = status.toLowerCase();
  if (s.includes("replied") || s.includes("follow-up drafted") || s.includes("follow-up sent")) return "hot";
  if (s.includes("sent") || s.includes("approved") || hasReply) return "warm";
  return "cold";
}

function formatLastContact(dateText: string): string {
  if (!dateText) return "Unknown";
  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) return dateText;
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function safeValue(v: string): string {
  return v || "—";
}

function loadCreds(): { notion?: { api_key?: string; database_id?: string } } {
  const raw = fs.readFileSync(CREDS_PATH, "utf8");
  return JSON.parse(raw);
}

function resolveNotionAuth(): { apiKey: string; dbId: string } {
  const envApiKey = process.env.NOTION_API_KEY;
  const envDbId = process.env.NOTION_DATABASE_ID;

  if (envApiKey && envDbId) {
    return { apiKey: envApiKey, dbId: envDbId };
  }

  if (fs.existsSync(CREDS_PATH)) {
    const creds = loadCreds();
    const apiKey = creds?.notion?.api_key;
    const dbId = creds?.notion?.database_id;
    if (apiKey && dbId) return { apiKey, dbId };
  }

  throw new Error(
    "Missing Notion credentials. Set NOTION_API_KEY + NOTION_DATABASE_ID (recommended for Vercel), or provide ~/.openclaw/credentials/enreach-lead-capture.json"
  );
}

export async function fetchMissionLeads(limit = 100): Promise<MissionLead[]> {
  const { apiKey, dbId } = resolveNotionAuth();

  const body = {
    page_size: Math.min(Math.max(limit, 1), 100),
    sorts: [{ property: "Date", direction: "descending" }],
  };

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Notion query failed (${res.status}): ${txt}`);
  }

  const data = (await res.json()) as NotionQueryResponse;

  return data.results.map((page) => {
    const p = page.properties;

    const name = getText(p.Name);
    const company = getText(p.Company);
    const role = getText(p.Role);
    const telegram = getText(p.Telegram);
    const account = getText(p.Account);
    const statusRaw = getSelect(p.Status);
    const approve = getCheckbox(p.Approve);
    const theirMessage = getText(p["Their Message"]);
    const draftReply = getText(p["Draft Reply"]);
    const date = getDate(p.Date) || page.last_edited_time || page.created_time || "";

    const overdueDays = date ? Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const blocked = statusRaw.toLowerCase().includes("blocked");

    return {
      id: page.id,
      name: safeValue(name),
      company: safeValue(company),
      role: safeValue(role),
      channel: telegram ? "Telegram" : "Enreach",
      temp: normTemp(statusRaw, theirMessage),
      status: normStatus(statusRaw),
      value: "—",
      lastContact: formatLastContact(date),
      notes: safeValue(theirMessage || draftReply || statusRaw || "No notes"),
      accountHandle: account || undefined,
      accountBlocked: blocked,
      awaitingApproval: approve,
      overdueDays,
    } satisfies MissionLead;
  });
}
