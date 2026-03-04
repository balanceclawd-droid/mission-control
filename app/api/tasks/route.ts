/**
 * GET /api/tasks
 *
 * Returns tasks from the two target Google Tasks lists, mapped to the
 * TaskBoardItem shape consumed by the /tasks UI.
 *
 * Server-only. Reads OAuth token from disk, refreshes if expired.
 */

import { NextResponse } from "next/server";
import {
  getAccessToken,
  findTargetListIds,
  listTasks,
  getListSlot,
  TARGET_LISTS,
  type GTask,
} from "@/lib/google-tasks-server";

export const dynamic = "force-dynamic"; // never cache

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskList = "today" | "blocked";

export interface TaskBoardItem {
  id: string;              // stable UI id (listId:taskId)
  googleTaskId: string;
  googleListId: string;
  title: string;
  priority: TaskPriority;
  list: TaskList;
  estimateMinutes: number;
  ageHours: number;
  annoyanceScore: number;
  annoyanceReason: string;
  blocked: boolean;
  blockedBy?: string;
  tags: string[];
  completed: boolean;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

/**
 * Derive rough priority from task title keywords.
 * Google Tasks has no priority field, so we do a best-effort inference.
 */
function inferPriority(title: string): TaskPriority {
  const t = title.toLowerCase();
  if (/(urgent|critical|asap|now|blocked|today)/i.test(t)) return "high";
  if (/(important|must|need|review)/i.test(t)) return "medium";
  return "medium";
}

/**
 * Derive a rough estimate from title keywords (in minutes).
 */
function inferEstimate(title: string): number {
  const t = title.toLowerCase();
  if (/(quick|short|brief|5 ?min|2 ?min|3 ?min)/i.test(t)) return 5;
  if (/(call|meeting|sync)/i.test(t)) return 30;
  if (/(prep|write|draft|create|build)/i.test(t)) return 20;
  return 10;
}

/**
 * Calculate age in hours from the task's `updated` timestamp.
 */
function calcAgeHours(updated?: string): number {
  if (!updated) return 1;
  const ms = Date.now() - new Date(updated).getTime();
  return Math.round(ms / (1000 * 60 * 60));
}

/**
 * Derive an annoyance score (1-10) from age and title.
 */
function inferAnnoyance(task: GTask): { score: number; reason: string } {
  const age = calcAgeHours(task.updated);
  let score = 5;
  let reason = "From Google Tasks";

  if (age > 48) {
    score = 8;
    reason = `Sitting unactioned for ${age}h`;
  } else if (age > 24) {
    score = 6;
    reason = `Over a day old (${age}h)`;
  } else if (age > 8) {
    score = 5;
    reason = `Added ${age}h ago`;
  } else {
    score = 4;
    reason = `Added ${age}h ago`;
  }

  if (/(blocked|waiting|stuck)/i.test(task.title)) {
    score = Math.min(10, score + 2);
    reason = "Blocked task — needs unblocking";
  }
  if (/(urgent|asap|critical)/i.test(task.title)) {
    score = Math.min(10, score + 2);
    reason = "Marked urgent";
  }

  if (task.notes) {
    reason = task.notes.slice(0, 80);
  }

  return { score, reason };
}

/**
 * Map a Google Task + list metadata to our UI TaskBoardItem.
 */
function mapTask(
  task: GTask,
  listId: string,
  listName: string
): TaskBoardItem {
  const listSlot: TaskList = getListSlot(listName);
  const age = calcAgeHours(task.updated);
  const { score, reason } = inferAnnoyance(task);
  const isBlocked = /(blocked|waiting)/i.test(task.title);

  return {
    id: `${listId}:${task.id}`,
    googleTaskId: task.id,
    googleListId: listId,
    title: task.title,
    priority: inferPriority(task.title),
    list: listSlot,
    estimateMinutes: inferEstimate(task.title),
    ageHours: age,
    annoyanceScore: score,
    annoyanceReason: reason,
    blocked: isBlocked,
    blockedBy: isBlocked ? "See task notes" : undefined,
    tags: [],
    completed: task.status === "completed",
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    const listMap = await findTargetListIds(accessToken);

    // Warn if we didn't find all target lists
    const found = TARGET_LISTS.filter((name) => listMap.has(name));
    if (found.length === 0) {
      return NextResponse.json(
        { error: "No matching task lists found", lists: [] },
        { status: 404 }
      );
    }

    const allTasks: TaskBoardItem[] = [];

    for (const [listName, listId] of listMap.entries()) {
      const tasks = await listTasks(accessToken, listId);
      for (const task of tasks) {
        allTasks.push(mapTask(task, listId, listName));
      }
    }

    return NextResponse.json({
      tasks: allTasks,
      source: "google-tasks",
      listsFound: found,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/tasks] Error:", message);
    return NextResponse.json(
      { error: message, tasks: [], source: "error" },
      { status: 500 }
    );
  }
}
