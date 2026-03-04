/**
 * Server-only Google Tasks client.
 *
 * Credential resolution order:
 * 1) GOOGLE_TASKS_TOKEN_JSON (hosted/runtime-safe, recommended for Vercel)
 * 2) GOOGLE_TASKS_TOKEN_PATH (optional custom file path)
 * 3) ~/.openclaw/credentials/google-tasks-token.json (local dev fallback)
 *
 * Handles token refresh automatically.
 * - If loaded from JSON env, refreshed token stays in-memory for this runtime instance.
 * - If loaded from file, refreshed token is persisted back to that file.
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

const DEFAULT_TOKEN_PATH = path.join(
  process.env.HOME ?? "/root",
  ".openclaw/credentials/google-tasks-token.json"
);

function getTokenPath(): string {
  return process.env.GOOGLE_TASKS_TOKEN_PATH || DEFAULT_TOKEN_PATH;
}

let runtimeTokenCache: StoredToken | null = null;

function readToken(): { token: StoredToken; source: "env" | "file" } {
  const envJson = process.env.GOOGLE_TASKS_TOKEN_JSON;
  if (envJson) {
    // Cache parsed token for this runtime instance.
    if (!runtimeTokenCache) {
      runtimeTokenCache = JSON.parse(envJson) as StoredToken;
    }
    return { token: runtimeTokenCache, source: "env" };
  }

  const tokenPath = getTokenPath();
  const raw = fs.readFileSync(tokenPath, "utf-8");
  return { token: JSON.parse(raw) as StoredToken, source: "file" };
}

function writeToken(token: StoredToken, source: "env" | "file"): void {
  if (source === "env") {
    // In hosted/serverless envs we can't safely write to disk.
    runtimeTokenCache = token;
    return;
  }

  const tokenPath = getTokenPath();
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2), "utf-8");
}

/** Returns a valid access token, refreshing if needed (with 60s buffer). */
export async function getAccessToken(): Promise<string> {
  const loaded = readToken();
  const stored = loaded.token;

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

  writeToken(updated, loaded.source);
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
