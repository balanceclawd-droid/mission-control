import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

type Window = "7d" | "30d" | "all";
type ReplyClass = "positive" | "neutral" | "negative" | "ooo" | "unknown";

interface NotionPage {
  id: string;
  properties: Record<string, any>;
  created_time?: string;
  last_edited_time?: string;
}

interface NotionQueryResponse {
  results: NotionPage[];
  has_more?: boolean;
  next_cursor?: string | null;
}

interface LeadMeta {
  name: string;
  url: string;
  owner?: string;
  variantId?: string;
  persona?: string;
  role?: string;
  fitScore?: number | null;
  drafted?: boolean;
}

interface CsvEvent {
  profileUrl: string;
  sentAt: Date;
  inboundAt?: Date | null;
  outboundSnippet?: string;
  inboundSnippet?: string;
  replyClass?: ReplyClass;
}

function resolveLinkedinNotionDbId(): string | null {
  return process.env.NOTION_DATABASE_ID_LINKEDIN ?? process.env.NOTION_DATABASE_ID ?? null;
}

function normalizeLinkedinUrl(raw: string): string {
  if (!raw) return "";
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (!host.includes("linkedin.com")) return "";
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return "";
    const kind = parts[0].toLowerCase();
    if (kind !== "in" && kind !== "company") return "";
    return `https://www.linkedin.com/${kind}/${parts[1].toLowerCase()}`;
  } catch {
    return "";
  }
}

function parseCsv(text: string): string[][] {
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
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch !== "\r") {
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

function classifyReply(text: string): ReplyClass {
  const s = (text || "").toLowerCase();
  if (!s.trim()) return "unknown";

  const ooo = ["out of office", "ooo", "away until", "back next week", "on vacation"];
  if (ooo.some((k) => s.includes(k))) return "ooo";

  const neg = ["not interested", "stop messaging", "remove me", "no thanks", "not now"];
  if (neg.some((k) => s.includes(k))) return "negative";

  const pos = ["interested", "let's talk", "lets talk", "send info", "book a call", "happy to chat"];
  if (pos.some((k) => s.includes(k))) return "positive";

  const neu = ["what do you do", "question", "clarif", "can you share", "tell me more"];
  if (neu.some((k) => s.includes(k))) return "neutral";

  return "unknown";
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const arr = [...values].sort((a, b) => a - b);
  const m = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[m - 1] + arr[m]) / 2 : arr[m];
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

function getText(prop: any): string {
  const items = prop?.title ?? prop?.rich_text ?? [];
  return items.map((x: any) => x?.plain_text ?? "").join("").trim();
}

function getSelect(prop: any): string {
  return prop?.status?.name?.trim?.() ?? prop?.select?.name?.trim?.() ?? "";
}

function getNumber(prop: any): number | null {
  return typeof prop?.number === "number" ? prop.number : null;
}

function pick(props: Record<string, any>, names: string[]): any {
  for (const n of names) if (props[n] !== undefined) return props[n];
  return undefined;
}

async function fetchLinkedinNotionMeta(apiKey: string, dbId: string): Promise<Map<string, LeadMeta>> {
  const pages: NotionPage[] = [];
  let cursor: string | null = null;

  for (let i = 0; i < 10; i++) {
    const body: any = { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) };
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
      const t = await res.text();
      throw new Error(`Notion query failed (${res.status}): ${t}`);
    }

    const data = (await res.json()) as NotionQueryResponse;
    pages.push(...data.results);
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }

  const out = new Map<string, LeadMeta>();
  for (const p of pages) {
    const props = p.properties;
    const rawUrl = getText(pick(props, ["LinkedIn URL", "Profile URL", "URL"])) || pick(props, ["LinkedIn URL", "Profile URL", "URL"])?.url || "";
    const url = normalizeLinkedinUrl(rawUrl);
    if (!url) continue;

    out.set(url, {
      name: getText(pick(props, ["Name", "Lead", "Person"])) || "Unknown",
      url,
      owner: getSelect(pick(props, ["Owner"])) || getText(pick(props, ["Owner"])),
      variantId: getText(pick(props, ["Variant ID", "variant_id", "Variant"])),
      persona: getSelect(pick(props, ["Persona"])) || getText(pick(props, ["Persona"])),
      role: getText(pick(props, ["Role", "Job Title"])),
      fitScore: getNumber(pick(props, ["Fit Score", "Score"])),
      drafted: Boolean(getText(pick(props, ["DM Draft", "Follow-up Draft"]))),
    });
  }

  return out;
}

function getLatestMessagesCsvPath(): string | null {
  const dir = path.join(os.homedir(), ".openclaw", "media", "inbound");
  if (!fs.existsSync(dir)) return null;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith("messages---") && f.endsWith(".csv"))
    .map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);

  return files[0] ? path.join(dir, files[0].f) : null;
}

function parseDate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseCsvEvents(csvText: string): CsvEvent[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;

  const iProfile = idx(["linkedin_profile_url", "recipient profile urls", "recipient_profile_url", "sender profile url"]);
  const iSent = idx(["sent_date", "date"]);
  const iInbound = idx(["last_inbound_date"]);
  const iDirection = idx(["message_direction", "folder"]);
  const iOutboundSnippet = idx(["outbound_message_snippet", "content"]);
  const iInboundSnippet = idx(["inbound_message_snippet"]);
  const iSenderUrl = idx(["sender profile url"]);
  const iRecipientUrl = idx(["recipient profile urls", "recipient_profile_url"]);

  const out: CsvEvent[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const direction = (iDirection >= 0 ? (r[iDirection] ?? "") : "").toLowerCase();
    const sentAt = parseDate(iSent >= 0 ? r[iSent] ?? "" : "");
    if (!sentAt) continue;

    const explicitProfile = iProfile >= 0 ? normalizeLinkedinUrl(r[iProfile] ?? "") : "";
    const sender = iSenderUrl >= 0 ? normalizeLinkedinUrl(r[iSenderUrl] ?? "") : "";
    const recipient = iRecipientUrl >= 0 ? normalizeLinkedinUrl(r[iRecipientUrl] ?? "") : "";

    let profileUrl = explicitProfile;
    if (!profileUrl) {
      if (direction.includes("sent") || direction.includes("outbound")) profileUrl = recipient || sender;
      else profileUrl = sender || recipient;
    }
    if (!profileUrl) continue;

    const inboundAt = parseDate(iInbound >= 0 ? r[iInbound] ?? "" : "");
    const outboundSnippet = iOutboundSnippet >= 0 ? r[iOutboundSnippet] ?? "" : "";
    const inboundSnippet = iInboundSnippet >= 0 ? r[iInboundSnippet] ?? "" : "";

    out.push({
      profileUrl,
      sentAt,
      inboundAt,
      outboundSnippet,
      inboundSnippet,
      replyClass: classifyReply(inboundSnippet),
    });
  }

  return out;
}

function inWindow(d: Date, w: Window): boolean {
  if (w === "all") return true;
  const cutoff = Date.now() - (w === "7d" ? 7 : 30) * 86_400_000;
  return d.getTime() >= cutoff;
}

function fitBand(score?: number | null): string {
  if (typeof score !== "number") return "unknown";
  if (score >= 80) return "80-100";
  if (score >= 60) return "60-79";
  return "below-60";
}

function bucketRole(role?: string): string {
  const r = (role || "").toLowerCase();
  if (!r) return "unknown";
  if (r.includes("founder") || r.includes("ceo") || r.includes("coo")) return "founder/executive";
  if (r.includes("head") || r.includes("director") || r.includes("vp")) return "leadership";
  if (r.includes("growth") || r.includes("marketing") || r.includes("bd")) return "growth/marketing";
  return "other";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const window = (url.searchParams.get("window") ?? "30d") as Window;

  const dbId = resolveLinkedinNotionDbId();
  const apiKey = process.env.NOTION_API_KEY;

  const csvPath = getLatestMessagesCsvPath();
  if (!csvPath) {
    return NextResponse.json({
      isMock: true,
      window,
      dataSource: "mock",
      linkedInDbConfigured: Boolean(dbId),
      linkedInDbId: dbId ? `${dbId.slice(0, 8)}…` : null,
      error: "No messages CSV found",
      sent: 0,
      replied: 0,
      replyRate: 0,
      positiveRate: 0,
      medianReply: "—",
      drafted: 0,
      hotReplies: [],
      needsFollowUp: [],
      unmatchedProfiles: [],
      unmatchedCount: 0,
    });
  }

  try {
    const csvText = fs.readFileSync(csvPath, "utf8");
    const events = parseCsvEvents(csvText).filter((e) => inWindow(e.sentAt, window));

    const notionMeta = apiKey && dbId ? await fetchLinkedinNotionMeta(apiKey, dbId) : new Map<string, LeadMeta>();

    const sent = events.length;
    const repliedEvents = events.filter((e) => e.inboundAt && e.inboundAt.getTime() > e.sentAt.getTime());
    const replied = repliedEvents.length;
    const positiveReplies = repliedEvents.filter((e) => e.replyClass === "positive").length;

    const replyRate = sent > 0 ? (replied / sent) * 100 : 0;
    const positiveRate = replied > 0 ? (positiveReplies / replied) * 100 : 0;

    const hoursToReply = repliedEvents
      .map((e) => ((e.inboundAt as Date).getTime() - e.sentAt.getTime()) / 3_600_000)
      .filter((n) => n >= 0);
    const med = median(hoursToReply);

    const drafted = Array.from(notionMeta.values()).filter((m) => m.drafted).length;

    const hotReplies = repliedEvents
      .filter((e) => e.replyClass === "positive" && e.inboundAt && Date.now() - e.inboundAt.getTime() <= 72 * 3_600_000)
      .slice(0, 10)
      .map((e) => ({
        name: notionMeta.get(e.profileUrl)?.name ?? e.profileUrl,
        url: e.profileUrl,
        repliedAt: (e.inboundAt as Date).toISOString(),
        owner: notionMeta.get(e.profileUrl)?.owner ?? null,
      }));

    const needsFollowUp = events
      .filter((e) => {
        const age = Date.now() - e.sentAt.getTime();
        const hasReply = Boolean(e.inboundAt && e.inboundAt.getTime() > e.sentAt.getTime());
        return age >= 3 * 86_400_000 && age <= 7 * 86_400_000 && !hasReply;
      })
      .slice(0, 10)
      .map((e) => ({
        name: notionMeta.get(e.profileUrl)?.name ?? e.profileUrl,
        url: e.profileUrl,
        owner: notionMeta.get(e.profileUrl)?.owner ?? null,
      }));

    const unmatchedProfiles = Array.from(new Set(events.map((e) => e.profileUrl)))
      .filter((u) => !notionMeta.has(u))
      .slice(0, 100);

    function breakdown(keyFn: (e: CsvEvent) => string) {
      const map = new Map<string, { sent: number; replied: number }>();
      for (const e of events) {
        const key = keyFn(e) || "unknown";
        const hasReply = Boolean(e.inboundAt && e.inboundAt.getTime() > e.sentAt.getTime());
        const cur = map.get(key) ?? { sent: 0, replied: 0 };
        cur.sent += 1;
        cur.replied += hasReply ? 1 : 0;
        map.set(key, cur);
      }
      return Array.from(map.entries()).map(([key, v]) => ({
        key,
        sent: v.sent,
        replied: v.replied,
        replyRate: v.sent > 0 ? Math.round((v.replied / v.sent) * 1000) / 10 : 0,
      }));
    }

    const byOwner = breakdown((e) => notionMeta.get(e.profileUrl)?.owner || "unknown");
    const byVariant = breakdown((e) => notionMeta.get(e.profileUrl)?.variantId || "unknown");
    const byPersona = breakdown((e) => notionMeta.get(e.profileUrl)?.persona || "unknown");
    const byRoleBucket = breakdown((e) => bucketRole(notionMeta.get(e.profileUrl)?.role));
    const byFitScoreBand = breakdown((e) => fitBand(notionMeta.get(e.profileUrl)?.fitScore));

    return NextResponse.json({
      isMock: false,
      window,
      dataSource: "csv+notion",
      linkedInDbConfigured: Boolean(dbId),
      linkedInDbId: dbId ? `${dbId.slice(0, 8)}…` : null,
      sent,
      replied,
      replyRate: Math.round(replyRate * 10) / 10,
      positiveReplies,
      positiveRate: Math.round(positiveRate * 10) / 10,
      medianReply: med !== null ? formatHours(med) : "—",
      drafted,
      funnel: {
        drafted,
        sent,
        replied,
        positiveReplies,
        callsBooked: repliedEvents.filter((e) => (e.inboundSnippet || "").toLowerCase().includes("call")).length,
      },
      breakdowns: {
        byOwner,
        byVariant,
        byPersona,
        byRoleBucket,
        byFitScoreBand,
      },
      hotReplies,
      needsFollowUp,
      unmatchedProfiles,
      unmatchedCount: unmatchedProfiles.length,
      readOnly: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        isMock: true,
        window,
        dataSource: "mock",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
