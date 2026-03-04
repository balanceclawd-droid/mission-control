import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const RYAN_URL = "https://www.linkedin.com/in/ryan-godson-1669a8211";

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

  const csvPath = findCsvPath();

  if (!csvPath) {
    const m = mockMetrics(window);
    return NextResponse.json({
      isMock: true,
      window,
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
      sent: sentLeads,
      replied: repliedLeads,
      replyRate: Math.round(replyRate * 10) / 10,
      positiveRate: Math.round(positiveRate * 10) / 10,
      medianReply,
      ...ops,
    });
  } catch (err) {
    console.error("[linkedin-metrics]", err);
    const m = mockMetrics(window);
    return NextResponse.json({ isMock: true, window, ...m, hotReplies: [], needsFollowUp: [], unmatchedCount: 0 });
  }
}
