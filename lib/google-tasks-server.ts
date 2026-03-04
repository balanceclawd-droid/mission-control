/**
 * Server-only Google Tasks client.
 * Uses token from ~/.openclaw/credentials/google-tasks-token.json.
 * Handles token refresh automatically and writes refreshed token back to disk.
 *
 * NEVER import this file from client components — it uses `fs` (Node.js only).
 */

import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredToken {
  token: string;
  refresh_token: string;
  token_uri: string;
  client_id: string;
  client_secret: string;
  scopes: string[];
  expiry: string; // ISO string
}

export interface GTaskList {
  id: string;
  title: string;
  kind: string;
}

export interface GTask {
  id: string;
  title: string;
  status: "needsAction" | "completed";
  notes?: string;
  due?: string;
  completed?: string;
  updated?: string;
  kind: string;
  selfLink: string;
  etag: string;
  position: string;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

const TOKEN_PATH = path.join(
  process.env.HOME ?? "/root",
  ".openclaw/credentials/google-tasks-token.json"
);

function readToken(): StoredToken {
  const raw = fs.readFileSync(TOKEN_PATH, "utf-8");
  return JSON.parse(raw) as StoredToken;
}

function writeToken(token: StoredToken): void {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), "utf-8");
}

/** Returns a valid access token, refreshing if needed (with 60s buffer). */
export async function getAccessToken(): Promise<string> {
  const stored = readToken();

  const expiry = new Date(stored.expiry).getTime();
  const bufferMs = 60 * 1000;

  if (Date.now() + bufferMs < expiry) {
    // Token is still valid
    return stored.token;
  }

  // Refresh
  const params = new URLSearchParams({
    client_id: stored.client_id,
    client_secret: stored.client_secret,
    refresh_token: stored.refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch(stored.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  const newExpiry = new Date(Date.now() + data.expires_in * 1000);
  const updated: StoredToken = {
    ...stored,
    token: data.access_token,
    expiry: newExpiry.toISOString(),
  };

  writeToken(updated);
  return updated.token;
}

// ─── Google Tasks API wrappers ────────────────────────────────────────────────

const BASE = "https://tasks.googleapis.com/tasks/v1";

async function gtRequest<T>(
  accessToken: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Tasks API error (${res.status}) ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

/** List all task lists for the authenticated user. */
export async function listTaskLists(accessToken: string): Promise<GTaskList[]> {
  const data = await gtRequest<{ items?: GTaskList[] }>(
    accessToken,
    "/users/@me/lists"
  );
  return data.items ?? [];
}

/** Fetch all active (non-completed) tasks for a given list. */
export async function listTasks(
  accessToken: string,
  listId: string
): Promise<GTask[]> {
  const qs = new URLSearchParams({
    showCompleted: "false",
    showHidden: "false",
    maxResults: "100",
  });
  const data = await gtRequest<{ items?: GTask[] }>(
    accessToken,
    `/lists/${listId}/tasks?${qs}`
  );
  return data.items ?? [];
}

/** Mark a task as completed. */
export async function completeTask(
  accessToken: string,
  listId: string,
  taskId: string
): Promise<GTask> {
  return gtRequest<GTask>(
    accessToken,
    `/lists/${listId}/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        completed: new Date().toISOString(),
      }),
    }
  );
}

// ─── Target list names ────────────────────────────────────────────────────────

/**
 * We match lists by keywords (case-insensitive) rather than exact names,
 * since the actual Google Tasks list title may vary slightly.
 *
 * Each entry: [uiName, ...keywords that must appear in the list title]
 */
export const TARGET_LIST_MATCHERS: Array<{
  uiName: string;
  /** All keywords must appear (case-insensitive) in the list title */
  keywords: string[];
  /** Keywords that must NOT appear (case-insensitive) — for disambiguation */
  excludeKeywords?: string[];
  /** Which slot in the UI does this map to */
  slot: "today" | "blocked";
}> = [
  {
    // Matches: "To do today" but NOT "...Blocked for today"
    uiName: "To Do Today",
    keywords: ["today"],
    excludeKeywords: ["right now", "blocked", "short"],
    slot: "today",
  },
  {
    // Matches: "To do, Right Now, Short Tasks / Blocked for today"
    uiName: "To do, Right Now / Blocked",
    keywords: ["right now"],
    slot: "blocked",
  },
];

export const TARGET_LISTS = TARGET_LIST_MATCHERS.map((m) => m.uiName);

function matchesMatcher(
  title: string,
  keywords: string[],
  excludeKeywords?: string[]
): boolean {
  const t = title.toLowerCase();
  const hasAll = keywords.every((kw) => t.includes(kw.toLowerCase()));
  if (!hasAll) return false;
  if (excludeKeywords) {
    const hasExcluded = excludeKeywords.some((kw) =>
      t.includes(kw.toLowerCase())
    );
    if (hasExcluded) return false;
  }
  return true;
}

/** Find and return the IDs for the two target task lists, using fuzzy keyword matching. */
export async function findTargetListIds(
  accessToken: string
): Promise<Map<string, string>> {
  const lists = await listTaskLists(accessToken);
  const result = new Map<string, string>(); // uiName → id

  for (const list of lists) {
    for (const matcher of TARGET_LIST_MATCHERS) {
      if (matchesMatcher(list.title, matcher.keywords, matcher.excludeKeywords)) {
        result.set(matcher.uiName, list.id);
        break; // don't double-match
      }
    }
  }

  return result;
}

/**
 * Returns the UI slot ("today" | "blocked") for a matched list name.
 */
export function getListSlot(uiName: string): "today" | "blocked" {
  return (
    TARGET_LIST_MATCHERS.find((m) => m.uiName === uiName)?.slot ?? "today"
  );
}
