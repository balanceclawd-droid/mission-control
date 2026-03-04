import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const RYAN_URL = "https://www.linkedin.com/in/ryan-godson-1669a8211";

function resolveLinkedinNotionDbId(): string | null {
  // Explicit LinkedIn DB var first, then legacy fallback.
  return process.env.NOTION_DATABASE_ID_LINKEDIN ?? process.env.NOTION_DATABASE_ID ?? null;
}

/* ────────────────────────────── CSV parser ────────────────────────────── */

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch === "\r") {
        // skip CR
      } else {
        field += ch;
      }
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/* ────────────────────────── Data types ──────────────────────────────── */

interface Message {
  conversationId: string;
  from: string;
  senderUrl: string;
  to: string;
  recipientUrl: string;
  date: Date;
  content: string;
  isRyan: boolean;
}

interface ConversationSummary {
  conversationId: string;
  leadName: string;
  leadUrl: string;
  ryanFirstMsgDate: Date;
  leadFirstReplyDate: Date | null;
  lastActivityDate: Date;
  leadReplied: boolean;
  positiveReply: boolean;
  hoursToReply: number | null;
}

/* ────────────────────────── CSV path resolver ───────────────────────── */

function findCsvPath(): string | null {
  const mediaDir = path.join(os.homedir(), ".openclaw", "media", "inbound");
  if (!fs.existsSync(mediaDir)) return null;

  const files = fs
    .readdirSync(mediaDir)
    .filter((f) => f.startsWith("messages---") && f.endsWith(".csv"))
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(mediaDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? path.join(mediaDir, files[0].name) : null;
}

/* ────────────────────────── Positive reply heuristic ──────────────────── */

const REJECTION_PHRASES = [
  "not interested",
  "no thank",
  "not looking",
  "not the right fit",
  "not relevant",
  "can't help",
  "cannot help",
  "unsubscribe",
  "remove me",
];

function isPositive(content: string): boolean {
  const lower = content.toLowerCase();
  if (REJECTION_PHRASES.some((p) => lower.includes(p))) return false;
  // Positive signals
  if (lower.includes("calendly") || lower.includes("calendar") || lower.includes("meet")) return true;
  if (lower.includes("?") && content.length > 40) return true;
  if (content.length > 120) return true;
  return false;
}

/* ────────────────────────── Core computation ───────────────────────────── */

function computeConversations(messages: Message[]): ConversationSummary[] {
  // Group by conversation
  const byConv = new Map<string, Message[]>();
  for (const m of messages) {
    if (!byConv.has(m.conversationId)) byConv.set(m.conversationId, []);
    byConv.get(m.conversationId)!.push(m);
  }

  const summaries: ConversationSummary[] = [];

  for (const [convId, msgs] of byConv) {
    // Sort ascending
    msgs.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Only care about conversations where Ryan sent something
    const ryanMsgs = msgs.filter((m) => m.isRyan);
    if (ryanMsgs.length === 0) continue;

    const ryanFirstMsg = ryanMsgs[0];

    // Lead is the other person in the convo
    const leadMsg = msgs.find((m) => !m.isRyan);
    const leadName = leadMsg?.from || "Unknown";
    const leadUrl = leadMsg?.senderUrl || "";

    // Lead replies = non-Ryan messages AFTER Ryan's first message
    const leadReplies = msgs.filter(
      (m) => !m.isRyan && m.date > ryanFirstMsg.date
    );

    const leadFirstReply = leadReplies.length > 0 ? leadReplies[0] : null;
    const hoursToReply = leadFirstReply
      ? (leadFirstReply.date.getTime() - ryanFirstMsg.date.getTime()) / 3_600_000
      : null;

    const lastActivityDate = msgs[msgs.length - 1].date;

    summaries.push({
      conversationId: convId,
      leadName,
      leadUrl,
      ryanFirstMsgDate: ryanFirstMsg.date,
      leadFirstReplyDate: leadFirstReply?.date ?? null,
      lastActivityDate,
      leadReplied: leadFirstReply !== null,
      positiveReply: leadFirstReply ? isPositive(leadFirstReply.content) : false,
      hoursToReply,
    });
  }

  return summaries;
}

/* ────────────────────────── Filter by window ───────────────────────────── */

type Window = "7d" | "30d" | "all";

function filterByWindow(summaries: ConversationSummary[], window: Window): ConversationSummary[] {
  if (window === "all") return summaries;
  const now = Date.now();
  const cutoff = window === "7d" ? now - 7 * 86_400_000 : now - 30 * 86_400_000;
  return summaries.filter((s) => s.ryanFirstMsgDate.getTime() >= cutoff);
}

/* ────────────────────────── Median helper ───────────────────────────── */

function median(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

/* ────────────────────────── Notion metrics path ───────────────────────────── */

interface NotionQueryResponse {
  results: Array<{ id: string; properties: Record<string, any>; created_time?: string; last_edited_time?: string }>;
  has_more?: boolean;
  next_cursor?: string | null;
}

function pickProp(props: Record<string, any>, names: string[]): any {
  for (const n of names) {
    if (props[n] !== undefined) return props[n];
  }
  return undefined;
}

function notionText(prop: any): string {
  const items = prop?.title ?? prop?.rich_text ?? [];
  return items.map((x: any) => x?.plain_text ?? "").join("").trim();
}

function notionSelect(prop: any): string {
  if (!prop) return "";
  if (prop?.status?.name) return String(prop.status.name).trim();
  if (prop?.select?.name) return String(prop.select.name).trim();
  const rich = notionText(prop);
  if (rich) return rich;
  return "";
}

function notionDate(prop: any): string {
  return prop?.date?.start ?? "";
}

function notionNumber(prop: any): number | null {
  return typeof prop?.number === "number" ? prop.number : null;
}

function hasMeaningfulValue(prop: any): boolean {
  if (!prop) return false;
  if (notionText(prop)) return true;
  if (notionSelect(prop)) return true;
  if (notionDate(prop)) return true;
  if (typeof prop?.number === "number") return true;
  if (typeof prop?.checkbox === "boolean") return true;
  if (prop?.url) return true;
  return false;
}

function isRepliedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s.includes("replied") ||
    s.includes("responded") ||
    s.includes("response") ||
    s.includes("interested") ||
    s.includes("positive") ||
    s.includes("meeting") ||
    s.includes("call") ||
    s.includes("booked")
  );
}

function isPositiveStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s.includes("positive") || s.includes("interested") || s.includes("meeting") || s.includes("call") || s.includes("qualified");
}

function isSentLikeStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s.includes("sent") || s.includes("contacted") || s.includes("replied") || s.includes("response") || s.includes("no response") || s.includes("meeting");
}

async function fetchLinkedinMetricsFromNotion(window: Window, apiKey: string, dbId: string, debug = false) {
  const now = Date.now();
  const cutoff = window === "7d" ? now - 7 * 86_400_000 : window === "30d" ? now - 30 * 86_400_000 : 0;

  const pages: Array<{ id: string; properties: Record<string, any>; created_time?: string; last_edited_time?: string }> = [];
  let cursor: string | null = null;

  for (let i = 0; i < 10; i++) {
    const body: any = {
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
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
    pages.push(...data.results);

    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }

  const propNonEmptyCounts: Record<string, number> = {};
  for (const page of pages) {
    for (const [k, v] of Object.entries(page.properties ?? {})) {
      if (hasMeaningfulValue(v)) propNonEmptyCounts[k] = (propNonEmptyCounts[k] ?? 0) + 1;
    }
  }

  const leads = pages
    .map((p) => {
      const props = p.properties;
      const name = notionText(pickProp(props, ["Name", "Lead", "Person", "Full Name"])) || "LinkedIn Member";
      const status = notionSelect(pickProp(props, ["Status", "Lead Status", "Pipeline Status", "State"])) || "";
      const sentAtRaw =
        notionDate(pickProp(props, ["Sent Date", "Date", "Created", "First Sent", "Last Contact", "Last Contacted"])) ||
        p.created_time ||
        p.last_edited_time ||
        "";
      const repliedAtRaw = notionDate(pickProp(props, ["Replied At", "Reply Date", "Last Reply", "Response Date"])) || "";
      const hoursToReplyRaw = notionNumber(pickProp(props, ["Hours to Reply", "Reply Hours", "TTFR Hours"]));

      const replyText = notionText(
        pickProp(props, ["Their Message", "Reply", "Response", "Lead Reply", "Last Message", "Inbound Message"])
      );

      const url =
        notionText(pickProp(props, ["LinkedIn URL", "Profile URL", "URL"])) ||
        pickProp(props, ["LinkedIn URL", "Profile URL", "URL"])?.url ||
        "";

      const sentAt = sentAtRaw ? new Date(sentAtRaw) : null;
      const repliedAt = repliedAtRaw ? new Date(repliedAtRaw) : null;
      const validSentAt = sentAt && !Number.isNaN(sentAt.getTime()) ? sentAt : null;
      const validRepliedAt = repliedAt && !Number.isNaN(repliedAt.getTime()) ? repliedAt : null;

      return {
        name,
        url,
        status,
        replyText,
        sentAt: validSentAt,
        repliedAt: validRepliedAt,
        hoursToReply: hoursToReplyRaw,
      };
    })
    .filter((l) => {
      if (!l.sentAt) return window === "all";
      return window === "all" ? true : l.sentAt.getTime() >= cutoff;
    });

  const sent = leads.filter((l) => isSentLikeStatus(l.status) || !!l.sentAt).length;
  const repliedRows = leads.filter((l) => isRepliedStatus(l.status) || !!l.repliedAt || Boolean(l.replyText));
  const replied = repliedRows.length;
  const replyRate = sent > 0 ? (replied / sent) * 100 : 0;

  const positive = repliedRows.filter((l) => isPositiveStatus(l.status) || (l.replyText?.length ?? 0) > 80).length;
  const positiveRate = replied > 0 ? (positive / replied) * 100 : 0;

  const hours = repliedRows
    .map((l) => {
      if (typeof l.hoursToReply === "number") return l.hoursToReply;
      if (l.sentAt && l.repliedAt) return (l.repliedAt.getTime() - l.sentAt.getTime()) / 3_600_000;
      return null;
    })
    .filter((x): x is number => x !== null && x >= 0);

  const med = median(hours);
  const medianReply = med !== null ? formatHours(med) : "—";

  const hotReplies = repliedRows
    .filter((l) => l.repliedAt && now - l.repliedAt.getTime() <= 72 * 3_600_000)
    .sort((a, b) => (b.repliedAt?.getTime() ?? 0) - (a.repliedAt?.getTime() ?? 0))
    .slice(0, 10)
    .map((l) => ({ name: l.name, url: l.url, repliedAt: (l.repliedAt as Date).toISOString() }));

  const needsFollowUp = leads
    .filter((l) => {
      if (!l.sentAt) return false;
      if (isRepliedStatus(l.status) || l.repliedAt) return false;
      const age = now - l.sentAt.getTime();
      return age >= 3 * 86_400_000 && age <= 7 * 86_400_000;
    })
    .slice(0, 10)
    .map((l) => ({ name: l.name, url: l.url }));

  const unmatchedCount = leads.filter((l) => !l.name || l.name === "LinkedIn Member").length;

  const payload: any = {
    isMock: false,
    window,
    dataSource: "notion",
    linkedInDbConfigured: true,
    linkedInDbId: `${dbId.slice(0, 8)}…`,
    sent,
    replied,
    replyRate: Math.round(replyRate * 10) / 10,
    positiveRate: Math.round(positiveRate * 10) / 10,
    medianReply,
    hotReplies,
    needsFollowUp,
    unmatchedCount,
  };

  if (debug) {
    payload.debug = {
      totalRowsFetched: pages.length,
      topNonEmptyProperties: Object.entries(propNonEmptyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20),
      sampleStatuses: leads.map((l) => l.status).filter(Boolean).slice(0, 20),
      rowsWithReplyText: leads.filter((l) => Boolean(l.replyText)).length,
      rowsWithReplyDate: leads.filter((l) => Boolean(l.repliedAt)).length,
    };
  }

  return payload;
}

/* ────────────────────────── Operational lists ───────────────────────────── */

function buildOperationalLists(
  summaries: ConversationSummary[],
  allMessages: Message[]
) {
  const now = Date.now();
  const h72 = 72 * 3_600_000;
  const d3 = 3 * 86_400_000;
  const d7 = 7 * 86_400_000;

  // Hot Replies: lead replied in last 72h
  const hotReplies = summaries
    .filter(
      (s) =>
        s.leadFirstReplyDate &&
        now - s.leadFirstReplyDate.getTime() <= h72
    )
    .sort((a, b) => b.leadFirstReplyDate!.getTime() - a.leadFirstReplyDate!.getTime())
    .slice(0, 10)
    .map((s) => ({
      name: s.leadName,
      url: s.leadUrl,
      repliedAt: s.leadFirstReplyDate!.toISOString(),
    }));

  // Needs Follow Up: Ryan sent, no lead reply, last Ryan message 3-7 days ago
  const byConv = new Map<string, Message[]>();
  for (const m of allMessages) {
    if (!byConv.has(m.conversationId)) byConv.set(m.conversationId, []);
    byConv.get(m.conversationId)!.push(m);
  }

  const needsFollowUp = summaries
    .filter((s) => {
      if (s.leadReplied) return false;
      // Find last Ryan message in this conversation
      const msgs = byConv.get(s.conversationId) ?? [];
      const ryanMsgs = msgs.filter((m) => m.isRyan);
      if (ryanMsgs.length === 0) return false;
      const lastRyan = ryanMsgs.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const age = now - lastRyan.date.getTime();
      return age >= d3 && age <= d7;
    })
    .slice(0, 10)
    .map((s) => ({ name: s.leadName, url: s.leadUrl }));

  // Unmatched Profiles: leads named "LinkedIn Member"
  const unmatchedCount = summaries.filter(
    (s) => s.leadName === "LinkedIn Member" || s.leadName === ""
  ).length;

  return { hotReplies, needsFollowUp, unmatchedCount };
}

/* ────────────────────────── Mock fallback ───────────────────────────── */

function mockMetrics(window: Window) {
  const base = {
    "7d": { sent: 42, replied: 11, replyRate: 26.2, positiveRate: 63.6, medianReply: "18h" },
    "30d": { sent: 187, replied: 43, replyRate: 23.0, positiveRate: 58.1, medianReply: "22h" },
    all: { sent: 512, replied: 109, replyRate: 21.3, positiveRate: 55.0, medianReply: "1d" },
  };
  return base[window];
}

/* ────────────────────────── Route handler ───────────────────────────── */

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const window = (url.searchParams.get("window") ?? "30d") as Window;

  const linkedInDbId = resolveLinkedinNotionDbId();
  const notionApiKey = process.env.NOTION_API_KEY;
  const csvPath = findCsvPath();
  const debug = url.searchParams.get("debug") === "1";

  // Path 1: Notion-first (preferred)
  if (notionApiKey && linkedInDbId) {
    try {
      const notionPayload = await fetchLinkedinMetricsFromNotion(window, notionApiKey, linkedInDbId, debug);
      return NextResponse.json(notionPayload);
    } catch (err) {
      console.error("[linkedin-metrics:notion]", err);
      // fall through to CSV fallback
    }
  }

  // Path 2: CSV fallback
  if (csvPath) {
    try {
      const raw = fs.readFileSync(csvPath, "utf-8");
    const rows = parseCSV(raw);
    if (rows.length < 2) throw new Error("Empty CSV");

    // Header: CONVERSATION ID,CONVERSATION TITLE,FROM,SENDER PROFILE URL,TO,RECIPIENT PROFILE URLS,DATE,SUBJECT,CONTENT,FOLDER,ATTACHMENTS
    const messages: Message[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 9) continue;
      const dateStr = row[6]?.trim();
      if (!dateStr) continue;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;

      const senderUrl = row[3]?.trim() ?? "";
      messages.push({
        conversationId: row[0]?.trim() ?? "",
        from: row[2]?.trim() ?? "",
        senderUrl,
        to: row[4]?.trim() ?? "",
        recipientUrl: row[5]?.trim() ?? "",
        date,
        content: row[8]?.trim() ?? "",
        isRyan: senderUrl === RYAN_URL,
      });
    }

    const allSummaries = computeConversations(messages);
    const filtered = filterByWindow(allSummaries, window);

    const sentLeads = filtered.length;
    const repliedLeads = filtered.filter((s) => s.leadReplied).length;
    const replyRate = sentLeads > 0 ? (repliedLeads / sentLeads) * 100 : 0;

    const repliedSet = filtered.filter((s) => s.leadReplied);
    const positiveCount = repliedSet.filter((s) => s.positiveReply).length;
    const positiveRate = repliedSet.length > 0 ? (positiveCount / repliedSet.length) * 100 : 0;

    const hours = filtered
      .filter((s) => s.hoursToReply !== null)
      .map((s) => s.hoursToReply!);
    const medH = median(hours);
    const medianReply = medH !== null ? formatHours(medH) : "—";

    const ops = buildOperationalLists(allSummaries, messages);

    return NextResponse.json({
      isMock: false,
      window,
      dataSource: "csv",
      linkedInDbConfigured: Boolean(linkedInDbId),
      linkedInDbId: linkedInDbId ? `${linkedInDbId.slice(0, 8)}…` : null,
      sent: sentLeads,
      replied: repliedLeads,
      replyRate: Math.round(replyRate * 10) / 10,
      positiveRate: Math.round(positiveRate * 10) / 10,
      medianReply,
      ...ops,
    });
    } catch (err) {
      console.error("[linkedin-metrics:csv]", err);
    }
  }

  // Path 3: Mock fallback
  const m = mockMetrics(window);
  return NextResponse.json({
    isMock: true,
    window,
    dataSource: "mock",
    linkedInDbConfigured: Boolean(linkedInDbId),
    linkedInDbId: linkedInDbId ? `${linkedInDbId.slice(0, 8)}…` : null,
    ...m,
    hotReplies: [
      { name: "Alice Wong", url: "", repliedAt: new Date(Date.now() - 3_600_000).toISOString() },
      { name: "James Patel", url: "", repliedAt: new Date(Date.now() - 14_400_000).toISOString() },
    ],
    needsFollowUp: [
      { name: "Dan Fox", url: "" },
      { name: "Tom Nguyen", url: "" },
      { name: "Yuki Tanaka", url: "" },
    ],
    unmatchedCount: 7,
  });
}
